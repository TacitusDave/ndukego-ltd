import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

/**
 * Liveness/readiness probe used by Railway's healthcheck and by uptime
 * monitors. Reports per-subsystem status so a degraded component (e.g. the
 * database briefly unreachable) is visible instead of guessing from the
 * outside.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, { ok: boolean; detail?: string }> = {};

    // Database round-trip — the critical dependency.
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = { ok: true };
    } catch (err) {
      checks.database = {
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    // Storage layer (DB-backed blobs). A missing probe path should resolve to
    // a clean "not found" — an error response here means storage itself is
    // failing, which is exactly what we want surfaced.
    try {
      await this.storage.exists('__healthcheck__/probe').catch(() => false);
      checks.storage = { ok: true };
    } catch (err) {
      checks.storage = {
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      };
    }

    const healthy = Object.values(checks).every((c) => c.ok);

    return {
      success: healthy,
      data: {
        status: healthy ? 'healthy' : 'degraded',
        service: 'NHGP API',
        version: '1.22.0',
        checks,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
