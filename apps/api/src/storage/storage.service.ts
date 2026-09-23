import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile, readFile, unlink, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { createChecksum } from '@nhgp/lib';
import { PrismaService } from '../prisma/prisma.service';

export interface StoredFile {
  storagePath: string;
  checksum: string;
  fileSize: number;
}

/** LRU cache entry. `null` buffer = negative cache (known-missing file). */
interface CacheEntry {
  buffer: Buffer | null;
  bytes: number;
}

/**
 * Media storage.
 *
 * Primary store is the Postgres `upload_files` table (BYTEA blobs). The
 * production database (Neon) is persistent — unlike the container's local
 * disk, which Railway wipes on every deploy. That wipe was the root cause
 * of uploaded images turning into broken icons after each release.
 *
 * Files uploaded before this change only exist on disk; read() transparently
 * falls back to the local filesystem so legacy media keeps serving.
 *
 * Hot media (site plans, covers, cards) is additionally held in a bounded
 * in-process LRU so property-card grids hit memory instead of re-fetching
 * multi-megabyte BYTEA rows from Neon on every page render. Absent paths are
 * negative-cached briefly so a 404 storm cannot hammer the database.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly basePath: string;
  private readonly provider: string;

  /** Bounded LRU of decoded buffers (~300 MB default). */
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheMaxBytes: number;
  private cacheBytes = 0;
  /** Paths confirmed missing; cached so 404s don't hit the DB every time. */
  private readonly negativeCache = new Map<string, number>();
  private readonly negativeTtlMs = 30_000;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.provider = this.config.get('STORAGE_PROVIDER') || 'local';
    this.basePath =
      this.config.get('STORAGE_LOCAL_PATH') || './storage/uploads';
    const mb = Number(this.config.get('STORAGE_CACHE_MB')) || 300;
    this.cacheMaxBytes = mb * 1024 * 1024;
  }

  private cacheGet(path: string): Buffer | null | undefined {
    const negativeAt = this.negativeCache.get(path);
    if (negativeAt !== undefined) {
      if (Date.now() - negativeAt < this.negativeTtlMs) return null;
      this.negativeCache.delete(path);
    }
    const hit = this.cache.get(path);
    if (!hit) return undefined;
    // LRU touch: re-insert to move to the back of the Map's insertion order.
    this.cache.delete(path);
    this.cache.set(path, hit);
    return hit.buffer;
  }

  private cacheSet(path: string, buffer: Buffer | null): void {
    if (buffer === null) {
      this.negativeCache.set(path, Date.now());
      return;
    }
    // Never cache anything oddly large (guards against pathologic uploads).
    if (buffer.length > this.cacheMaxBytes) return;

    const existing = this.cache.get(path);
    if (existing) {
      this.cacheBytes -= existing.bytes;
      this.cache.delete(path);
    }

    // Evict least-recently-used entries (Map iteration = insertion order)
    // until the new buffer fits.
    while (this.cacheBytes + buffer.length > this.cacheMaxBytes && this.cache.size > 0) {
      const oldest = this.cache.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      const evicted = this.cache.get(oldest);
      this.cacheBytes -= evicted?.bytes ?? 0;
      this.cache.delete(oldest);
    }

    this.cache.set(path, { buffer, bytes: buffer.length });
    this.cacheBytes += buffer.length;
  }

  private cacheDelete(path: string): void {
    const entry = this.cache.get(path);
    if (entry) {
      this.cacheBytes -= entry.bytes;
      this.cache.delete(path);
    }
    this.negativeCache.delete(path);
  }

  async store(relativePath: string, buffer: Buffer): Promise<StoredFile> {
    const checksum = await createChecksum(buffer);

    // Persist in the database so the file survives redeploys/restarts.
    const bytes = new Uint8Array(buffer);
    await this.prisma.uploadFile.upsert({
      where: { path: relativePath },
      create: {
        path: relativePath,
        data: bytes,
        mimeType: 'application/octet-stream',
        size: buffer.length,
      },
      update: { data: bytes, size: buffer.length },
    });

    // Best-effort mirror to disk (handy for local dev tooling; harmless in prod).
    if (this.provider === 'local') {
      await this.storeLocal(relativePath, buffer).catch((err: unknown) =>
        this.logger.warn(
          `Disk mirror failed for ${relativePath}: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }

    this.cacheSet(relativePath, buffer);

    return { storagePath: relativePath, checksum, fileSize: buffer.length };
  }

  async read(storagePath: string): Promise<Buffer> {
    // 0) In-process cache (fast path — no DB round-trip)
    const cached = this.cacheGet(storagePath);
    if (cached !== undefined) {
      if (cached === null) throw new Error(`File not found in storage: ${storagePath}`);
      return cached;
    }

    // 1) Database (authoritative, survives redeploys)
    const row = await this.prisma.uploadFile
      .findUnique({ where: { path: storagePath } })
      .catch((err: unknown) => {
        this.logger.error(
          `DB read failed for ${storagePath}: ${err instanceof Error ? err.message : String(err)}`,
        );
        return null;
      });
    if (row) {
      const buffer = Buffer.from(row.data);
      this.cacheSet(storagePath, buffer);
      return buffer;
    }

    // 2) Local disk (legacy files uploaded before DB storage)
    if (this.provider === 'local') {
      const legacyDirs = [
        this.basePath,
        './storage/uploads',
        './storage/documents',
      ];
      for (const dir of legacyDirs) {
        try {
          const buffer = await readFile(join(dir, storagePath));
          this.cacheSet(storagePath, buffer);
          return buffer;
        } catch {
          // try next location
        }
      }
    }

    // Negative-cache so repeated 404s don't keep hitting the database.
    this.cacheSet(storagePath, null);
    throw new Error(`File not found in storage: ${storagePath}`);
  }

  async exists(storagePath: string): Promise<boolean> {
    const row = await this.prisma.uploadFile
      .findUnique({ where: { path: storagePath }, select: { id: true } })
      .catch(() => null);
    if (row) return true;
    if (this.provider === 'local') {
      try {
        await stat(join(this.basePath, storagePath));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async delete(storagePath: string): Promise<void> {
    await this.prisma.uploadFile.deleteMany({ where: { path: storagePath } });
    this.cacheDelete(storagePath);
    if (this.provider === 'local') {
      const fullPath = join(this.basePath, storagePath);
      await unlink(fullPath).catch(() => undefined);
    }
  }

  private async storeLocal(
    relativePath: string,
    buffer: Buffer,
  ): Promise<StoredFile> {
    const fullPath = join(this.basePath, relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    return { storagePath: relativePath, checksum: '', fileSize: buffer.length };
  }
}
