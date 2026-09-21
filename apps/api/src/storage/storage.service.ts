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
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly basePath: string;
  private readonly provider: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.provider = this.config.get('STORAGE_PROVIDER') || 'local';
    this.basePath = this.config.get('STORAGE_LOCAL_PATH') || './storage/uploads';
  }

  async store(relativePath: string, buffer: Buffer): Promise<StoredFile> {
    const checksum = await createChecksum(buffer);

    // Persist in the database so the file survives redeploys/restarts.
    const bytes = new Uint8Array(buffer);
    await this.prisma.uploadFile.upsert({
      where: { path: relativePath },
      create: { path: relativePath, data: bytes, mimeType: 'application/octet-stream', size: buffer.length },
      update: { data: bytes, size: buffer.length },
    });

    // Best-effort mirror to disk (handy for local dev tooling; harmless in prod).
    if (this.provider === 'local') {
      await this.storeLocal(relativePath, buffer).catch((err) =>
        this.logger.warn(`Disk mirror failed for ${relativePath}: ${err?.message ?? err}`),
      );
    }

    return { storagePath: relativePath, checksum, fileSize: buffer.length };
  }

  async read(storagePath: string): Promise<Buffer> {
    // 1) Database (authoritative, survives redeploys)
    const row = await this.prisma.uploadFile
      .findUnique({ where: { path: storagePath } })
      .catch((err) => {
        this.logger.error(`DB read failed for ${storagePath}: ${err?.message ?? err}`);
        return null;
      });
    if (row) return Buffer.from(row.data);

    // 2) Local disk (legacy files uploaded before DB storage)
    if (this.provider === 'local') {
      const legacyDirs = [this.basePath, './storage/documents'];
      for (const dir of legacyDirs) {
        try {
          return await readFile(join(dir, storagePath));
        } catch {
          // try next location
        }
      }
    }

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
    if (this.provider === 'local') {
      const fullPath = join(this.basePath, storagePath);
      await unlink(fullPath).catch(() => undefined);
    }
  }

  private async storeLocal(relativePath: string, buffer: Buffer): Promise<StoredFile> {
    const fullPath = join(this.basePath, relativePath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    return { storagePath: relativePath, checksum: '', fileSize: buffer.length };
  }
}
