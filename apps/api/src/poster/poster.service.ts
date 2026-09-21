import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PosterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async findAll() {
    return this.prisma.poster.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAllPublic() {
    return this.prisma.poster.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const poster = await this.prisma.poster.findUnique({ where: { id } });
    if (!poster) throw new NotFoundException('Poster not found');
    return poster;
  }

  async create(body: { title?: string; description?: string; linkUrl?: string }, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must be smaller than 5 MB');
    }

    const ext = extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `posters/${filename}`;
    await this.storage.store(storagePath, file.buffer);

    const existingCount = await this.prisma.poster.count();

    return this.prisma.poster.create({
      data: {
        title: body.title ?? null,
        description: body.description ?? null,
        imageUrl: `/uploads/posters/${filename}`,
        linkUrl: body.linkUrl ?? null,
        sortOrder: existingCount,
        isActive: true,
      },
    });
  }

  async update(
    id: string,
    body: { title?: string; description?: string; linkUrl?: string },
    file?: Express.Multer.File,
  ) {
    const poster = await this.findOne(id);

    if (file) {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) {
        throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Image must be smaller than 5 MB');
      }

      if (poster.imageUrl) {
        await this.storage.delete(poster.imageUrl.replace('/uploads/', '')).catch(() => undefined);
      }

      const ext = extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
      const filename = `${uuidv4()}${ext}`;
      const storagePath = `posters/${filename}`;
      await this.storage.store(storagePath, file.buffer);

      await this.prisma.poster.update({
        where: { id },
        data: {
          title: body.title ?? poster.title,
          description: body.description ?? poster.description,
          linkUrl: body.linkUrl ?? poster.linkUrl,
          imageUrl: `/uploads/posters/${filename}`,
        },
      });
    } else {
      await this.prisma.poster.update({
        where: { id },
        data: {
          title: body.title ?? poster.title,
          description: body.description ?? poster.description,
          linkUrl: body.linkUrl ?? poster.linkUrl,
        },
      });
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    const poster = await this.findOne(id);

    if (poster.imageUrl) {
      await this.storage.delete(poster.imageUrl.replace('/uploads/', '')).catch(() => undefined);
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
