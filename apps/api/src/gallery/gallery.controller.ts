import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermissions,
  Public,
} from '../auth/decorators/permissions.decorator';

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Public()
  @Get('public')
  findPublic() {
    return this.galleryService.findAllPublic();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @RequirePermissions('property.read')
  findAll() {
    return this.galleryService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('property.create')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'frame', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 160 * 1024 * 1024 } },
    ),
  )
  create(
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; frame?: Express.Multer.File[] },
    @Body()
    body: {
      title?: string;
      description?: string;
      linkUrl?: string;
      type?: string;
      groupName?: string;
      width?: string;
      height?: string;
    },
  ) {
    return this.galleryService.create(
      body,
      files.file?.[0] ?? (undefined as never),
      files.frame?.[0],
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('property.update')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'file', maxCount: 1 },
        { name: 'frame', maxCount: 1 },
      ],
      { storage: memoryStorage(), limits: { fileSize: 160 * 1024 * 1024 } },
    ),
  )
  update(
    @Param('id') id: string,
    @UploadedFiles()
    files: { file?: Express.Multer.File[]; frame?: Express.Multer.File[] },
    @Body()
    body: {
      title?: string;
      description?: string;
      linkUrl?: string;
      groupName?: string;
      width?: string;
      height?: string;
    },
  ) {
    return this.galleryService.update(
      id,
      body,
      files.file?.[0],
      files.frame?.[0],
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/toggle')
  @RequirePermissions('property.update')
  toggleActive(@Param('id') id: string) {
    return this.galleryService.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @RequirePermissions('property.delete')
  delete(@Param('id') id: string) {
    return this.galleryService.delete(id);
  }
}
