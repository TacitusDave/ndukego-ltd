import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

/**
 * Read intrinsic pixel dimensions straight from image headers — no image
 * library needed. Handles PNG, JPEG, and WebP (the three formats the poster
 * endpoints accept). Returns null for anything unparsable; dimension data is
 * optional everywhere downstream.
 */
function detectDimensions(
  buf: Buffer,
): { width: number; height: number } | null {
  try {
    // PNG: 8-byte signature, then IHDR (width/height at offsets 16/20, big-endian)
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    // JPEG: scan segment markers for the SOF0–SOF3 frame header
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      const isSof = (m: number) =>
        m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m);
      let off = 2;
      while (off + 9 < buf.length) {
        if (buf[off] !== 0xff) {
          off++;
          continue;
        }
        // Skip any 0xFF fill bytes before the marker byte.
        let m = off + 1;
        while (m < buf.length && buf[m] === 0xff) m++;
        if (m >= buf.length) return null;
        const marker = buf[m];
        const body = m + 1;
        if (isSof(marker)) {
          return {
            height: buf.readUInt16BE(body + 3),
            width: buf.readUInt16BE(body + 5),
          };
        }
        if (
          marker === 0xd8 ||
          (marker >= 0xd0 && marker <= 0xd9) ||
          marker === 0x01
        ) {
          off = body + 1;
          continue;
        }
        const len = buf.readUInt16BE(body);
        if (len < 2) return null;
        off = body + len;
      }
      return null;
    }
    // WebP: RIFF....WEBP, then VP8X (canvas size) / VP8 / VP8L chunks
    if (
      buf.length > 30 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      const chunk = buf.toString('ascii', 12, 16);
      if (chunk === 'VP8X') {
        const w = 1 + ((buf[24] | (buf[25] << 8) | (buf[26] << 16)) & 0xffffff);
        const h = 1 + ((buf[27] | (buf[28] << 8) | (buf[29] << 16)) & 0xffffff);
        return { width: w, height: h };
      }
      if (chunk === 'VP8 ') {
        // lossy: frame tag (3 bytes) then start code 0x9d 0x01 0x2a, then 14-bit dims
        const w = buf.readUInt16LE(26) & 0x3fff;
        const h = buf.readUInt16LE(28) & 0x3fff;
        return { width: w, height: h };
      }
      if (chunk === 'VP8L') {
        // lossless: 14-bit width-1 and height-1 packed in 4 bytes at offset 21
        const b = buf.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
    }
  } catch {
    return null;
  }
  return null;
}

@Injectable()
export class PosterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll() {
    return this.prisma.poster.findMany({
      orderBy: [{ groupName: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findAllPublic() {
    return this.prisma.poster.findMany({
      where: { isActive: true },
      orderBy: [{ groupName: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const poster = await this.prisma.poster.findUnique({ where: { id } });
    if (!poster) throw new NotFoundException('Poster not found');
    return poster;
  }

  async create(
    body: {
      title?: string;
      description?: string;
      linkUrl?: string;
      groupName?: string;
      width?: string;
      height?: string;
    },
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must be smaller than 5 MB');
    }

    const ext = extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `posters/${filename}`;
    await this.storage.store(storagePath, file.buffer);

    const existingCount = await this.prisma.poster.count();

    const detected = detectDimensions(file.buffer);

    return this.prisma.poster.create({
      data: {
        title: body.title ?? null,
        description: body.description ?? null,
        imageUrl: `/uploads/posters/${filename}`,
        linkUrl: body.linkUrl ?? null,
        // Detected dimensions win; the admin form can override them.
        width:
          detected?.width ??
          (body.width ? parseInt(body.width, 10) || null : null),
        height:
          detected?.height ??
          (body.height ? parseInt(body.height, 10) || null : null),
        groupName: body.groupName?.trim() || null,
        sortOrder: existingCount,
        isActive: true,
      },
    });
  }

  async update(
    id: string,
    body: {
      title?: string;
      description?: string;
      linkUrl?: string;
      groupName?: string;
      width?: string;
      height?: string;
    },
    file?: Express.Multer.File,
  ) {
    const poster = await this.findOne(id);

    if (file) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        throw new BadRequestException(
          'Only JPEG, PNG, and WebP images are allowed',
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Image must be smaller than 5 MB');
      }

      const ext =
        extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
      const filename = `${uuidv4()}${ext}`;
      const storagePath = `posters/${filename}`;
      await this.storage.store(storagePath, file.buffer);

      // Record first, then best-effort removal of the replaced blob — never
      // the other way around, or a failure would orphan the poster URL.
      const previousUrl = poster.imageUrl;

      const detected = detectDimensions(file.buffer);

      await this.prisma.poster.update({
        where: { id },
        data: {
          title: body.title ?? poster.title,
          description: body.description ?? poster.description,
          linkUrl: body.linkUrl ?? poster.linkUrl,
          imageUrl: `/uploads/posters/${filename}`,
          width:
            detected?.width ??
            (body.width ? parseInt(body.width, 10) || null : poster.width),
          height:
            detected?.height ??
            (body.height ? parseInt(body.height, 10) || null : poster.height),
          groupName:
            body.groupName !== undefined
              ? body.groupName.trim() || null
              : poster.groupName,
        },
      });

      if (previousUrl && previousUrl !== `/uploads/${storagePath}`) {
        await this.storage
          .delete(previousUrl.replace('/uploads/', ''))
          .catch(() => undefined);
      }
    } else {
      await this.prisma.poster.update({
        where: { id },
        data: {
          title: body.title ?? poster.title,
          description: body.description ?? poster.description,
          linkUrl: body.linkUrl ?? poster.linkUrl,
          groupName:
            body.groupName !== undefined
              ? body.groupName.trim() || null
              : poster.groupName,
          width:
            body.width !== undefined
              ? parseInt(body.width, 10) || null
              : poster.width,
          height:
            body.height !== undefined
              ? parseInt(body.height, 10) || null
              : poster.height,
        },
      });
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    const poster = await this.findOne(id);

    if (poster.imageUrl) {
      await this.storage
        .delete(poster.imageUrl.replace('/uploads/', ''))
        .catch(() => undefined);
    }

    await this.prisma.poster.delete({ where: { id } });
    return { success: true };
  }

  async toggleActive(id: string) {
    const poster = await this.findOne(id);
    return this.prisma.poster.update({
      where: { id },
      data: { isActive: !poster.isActive },
    });
  }
}
