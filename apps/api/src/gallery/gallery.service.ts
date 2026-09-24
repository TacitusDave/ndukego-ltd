import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

/** Media kinds the gallery supports. */
export type GalleryType = 'IMAGE' | 'VIDEO' | 'COLLAGE';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];

const IMAGE_MAX = 12 * 1024 * 1024; // collages are big — 12MB
const VIDEO_MAX = 150 * 1024 * 1024; // 150MB for videos
const FRAME_MAX = 5 * 1024 * 1024;

/**
 * Read intrinsic pixel dimensions straight from image headers — no image
 * library needed. Handles PNG, JPEG, and WebP. Returns null for anything
 * unparsable; dimension data is optional everywhere downstream.
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
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll() {
    return this.prisma.galleryItem.findMany({
      orderBy: [{ groupName: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findAllPublic() {
    return this.prisma.galleryItem.findMany({
      where: { isActive: true },
      orderBy: [{ groupName: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Gallery item not found');
    return item;
  }

  /** Best-effort blob cleanup for a replaced/removed file. */
  private async removeBlob(url: string | null | undefined) {
    if (!url) return;
    await this.storage
      .delete(url.replace('/uploads/', ''))
      .catch(() => undefined);
  }

  /** Persist one uploaded file and return its public /uploads URL. */
  private async saveFile(
    file: Express.Multer.File,
    folder: 'gallery' | 'gallery/videos' | 'gallery/frames',
  ): Promise<string> {
    const ext = extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `${folder}/${filename}`;
    await this.storage.store(storagePath, file.buffer);
    return `/uploads/${storagePath}`;
  }

  private validateUpload(file: Express.Multer.File, expect: 'image' | 'video') {
    if (expect === 'video') {
      if (!VIDEO_MIMES.includes(file.mimetype)) {
        throw new BadRequestException('Only MP4, WebM, and MOV videos are allowed');
      }
      if (file.size > VIDEO_MAX) {
        throw new BadRequestException('Video must be smaller than 150 MB');
      }
    } else {
      if (!IMAGE_MIMES.includes(file.mimetype)) {
        throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
      }
      if (file.size > IMAGE_MAX) {
        throw new BadRequestException('Image must be smaller than 12 MB');
      }
    }
  }

  async create(
    body: {
      title?: string;
      description?: string;
      linkUrl?: string;
      type?: string;
      groupName?: string;
      width?: string;
      height?: string;
    },
    file: Express.Multer.File,
    frameFile?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A media file is required');
    }

    const type: GalleryType =
      body.type === 'VIDEO' || body.type === 'COLLAGE' ? body.type : 'IMAGE';

    const mediaUrlValue = await this.saveFile(
      file,
      type === 'VIDEO' ? 'gallery/videos' : 'gallery',
    );

    let posterFrameUrl: string | null = null;
    if (type === 'VIDEO' && frameFile) {
      this.validateUpload(frameFile, 'image');
      posterFrameUrl = await this.saveFile(frameFile, 'gallery/frames');
    }

    let width: number | null =
      body.width ? parseInt(body.width, 10) || null : null;
    let height: number | null =
      body.height ? parseInt(body.height, 10) || null : null;

    if (type === 'VIDEO' && frameFile) {
      const d = detectDimensions(frameFile.buffer);
      if (d) {
        width = d.width;
        height = d.height;
      }
    } else if (type !== 'VIDEO') {
      // IMAGE and COLLAGE are single composed images.
      this.validateUpload(file, 'image');
      const d = detectDimensions(file.buffer);
      if (d) {
        width = d.width;
        height = d.height;
      }
    }

    const existingCount = await this.prisma.galleryItem.count();

    return this.prisma.galleryItem.create({
      data: {
        title: body.title ?? null,
        description: body.description ?? null,
        // For videos without a frame, the media URL doubles as the grid src
        // (browsers typically show the first frame for direct video URLs in
        // an <img> fallback context is not reliable — the web layer renders
        // a <video preload="metadata"> tile instead when there is no frame).
        imageUrl: mediaUrlValue,
        linkUrl: body.linkUrl ?? null,
        type,
        mediaUrl: type === 'VIDEO' ? mediaUrlValue : null,
        posterFrameUrl,
        collageImages: [],
        width,
        height,
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
    frameFile?: Express.Multer.File,
  ) {
    const item = await this.findOne(id);

    if (file) {
      const isVideo =
        item.type === 'VIDEO' ||
        (!item.type && file.mimetype.startsWith('video/')) ||
        VIDEO_MIMES.includes(file.mimetype);
      this.validateUpload(file, isVideo ? 'video' : 'image');

      const storageUrl = await this.saveFile(
        file,
        isVideo ? 'gallery/videos' : 'gallery',
      );

      let width = item.width;
      let height = item.height;
      let posterFrameUrl = item.posterFrameUrl;

      if (isVideo) {
        if (frameFile) {
          this.validateUpload(frameFile, 'image');
          const newFrame = await this.saveFile(frameFile, 'gallery/frames');
          await this.removeBlob(posterFrameUrl);
          posterFrameUrl = newFrame;
          const d = detectDimensions(frameFile.buffer);
          if (d) {
            width = d.width;
            height = d.height;
          }
        }
      } else {
        const d = detectDimensions(file.buffer);
        if (d) {
          width = d.width;
          height = d.height;
        }
        if (item.type === 'VIDEO') {
          await this.removeBlob(item.posterFrameUrl);
          posterFrameUrl = null;
        }
      }

      const previousUrl = item.imageUrl;
      const previousMediaUrl = item.mediaUrl;

      await this.prisma.galleryItem.update({
        where: { id },
        data: {
          title: body.title ?? item.title,
          description: body.description ?? item.description,
          linkUrl: body.linkUrl ?? item.linkUrl,
          imageUrl: storageUrl,
          mediaUrl: isVideo ? storageUrl : null,
          posterFrameUrl,
          width,
          height,
          groupName:
            body.groupName !== undefined
              ? body.groupName.trim() || null
              : item.groupName,
        },
      });

      // Record first, then best-effort removal of the replaced blobs.
      if (previousUrl && previousUrl !== storageUrl) {
        await this.removeBlob(previousUrl);
      }
      if (previousMediaUrl && previousMediaUrl !== storageUrl) {
        await this.removeBlob(previousMediaUrl);
      }
    } else if (frameFile && item.type === 'VIDEO') {
      this.validateUpload(frameFile, 'image');
      const newFrame = await this.saveFile(frameFile, 'gallery/frames');
      await this.removeBlob(item.posterFrameUrl);
      const d = detectDimensions(frameFile.buffer);
      await this.prisma.galleryItem.update({
        where: { id },
        data: {
          posterFrameUrl: newFrame,
          ...(d ? { width: d.width, height: d.height } : {}),
        },
      });
    } else {
      await this.prisma.galleryItem.update({
        where: { id },
        data: {
          title: body.title ?? item.title,
          description: body.description ?? item.description,
          linkUrl: body.linkUrl ?? item.linkUrl,
          groupName:
            body.groupName !== undefined
              ? body.groupName.trim() || null
              : item.groupName,
          width:
            body.width !== undefined
              ? parseInt(body.width, 10) || null
              : item.width,
          height:
            body.height !== undefined
              ? parseInt(body.height, 10) || null
              : item.height,
        },
      });
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    const item = await this.findOne(id);

    if (item.imageUrl) {
      await this.removeBlob(item.imageUrl);
    }
    if (item.mediaUrl && item.mediaUrl !== item.imageUrl) {
      await this.removeBlob(item.mediaUrl);
    }
    if (item.posterFrameUrl) {
      await this.removeBlob(item.posterFrameUrl);
    }

    await this.prisma.galleryItem.delete({ where: { id } });
    return { success: true };
  }

  async toggleActive(id: string) {
    const item = await this.findOne(id);
    return this.prisma.galleryItem.update({
      where: { id },
      data: { isActive: !item.isActive },
    });
  }
}
