import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PosterService } from './poster.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermissions,
  Public,
} from '../auth/decorators/permissions.decorator';

@Controller('posters')
export class PosterController {
  constructor(private readonly posterService: PosterService) {}

  @Public()
  @Get('public')
  findPublic() {
    return this.posterService.findAllPublic();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @RequirePermissions('property.read')
  findAll() {
    return this.posterService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('property.create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 6 * 1024 * 1024 },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
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
    return this.posterService.create(body, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('property.update')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 6 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
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
    return this.posterService.update(id, body, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/toggle')
  @RequirePermissions('property.update')
  toggleActive(@Param('id') id: string) {
    return this.posterService.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @RequirePermissions('property.delete')
  delete(@Param('id') id: string) {
    return this.posterService.delete(id);
  }
}
