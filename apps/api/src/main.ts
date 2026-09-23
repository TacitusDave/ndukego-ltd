import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { extname } from 'path';
import { createHash } from 'crypto';
import { AppModule } from './app.module';
import { StorageService } from './storage/storage.service';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());

  // Serve uploaded media from storage (Postgres blobs, with disk fallback for
  // legacy files). Media must be reachable cross-origin from the Vercel apps,
  // so CORP is explicitly set to `cross-origin`.
  const storage = app.get(StorageService);
  const logger = new Logger('Uploads');
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    void (async () => {
      try {
        const relativePath = decodeURIComponent(req.path).replace(/^\/+/, '');
        if (!relativePath || relativePath.includes('..')) {
          return res.status(400).end();
        }
        const buffer = await storage.read(relativePath);

        // Content-based ETag: unchanged files answer the browser's revalidation
        // with a bodyless 304 instead of re-streaming megabytes.
        const etag = `"${createHash('sha1').update(buffer).digest('hex')}"`;
        res.setHeader('ETag', etag);
        if (req.headers['if-none-match'] === etag) {
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          return res.status(304).end();
        }

        const mime =
          MIME_BY_EXT[extname(relativePath).toLowerCase()] ??
          'application/octet-stream';
        res.setHeader('Content-Type', mime);
        // Browsers only apply immutable caching to sniffable image types;
        // everything else (PDFs, docs) revalidates via ETag instead.
        const cacheable = /^(image\/|video\/)/.test(mime);
        res.setHeader(
          'Cache-Control',
          cacheable
            ? 'public, max-age=31536000, immutable'
            : 'public, max-age=0, must-revalidate',
        );
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Length', String(buffer.length));
        return res.status(200).send(buffer);
      } catch {
        logger.warn(`Upload not found: ${req.path}`);
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        return res.status(404).end();
      }
    })();
  });

  const corsOrigins = (
    process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001'
  )
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 NHGP API running at http://localhost:${port}/api/v1`);
}

void bootstrap(); // entry point — intentionally fire-and-forget
