import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { DocumentService, UploadDocumentDto } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';
import { DocumentStatus } from '@nhgp/database';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post('upload')
  @RequirePermissions('document.upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const dto: UploadDocumentDto = {
      title: body.title,
      category: body.category as never,
      documentType: body.documentType as never,
      entityType: body.entityType as never,
      entityId: body.entityId,
      referenceNumber: body.referenceNumber || undefined,
      securityClassification:
        (body.securityClassification as never) || undefined,
      department: body.department || undefined,
      tags: body.tags
        ? body.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      expirationDate: body.expirationDate
        ? new Date(body.expirationDate)
        : undefined,
    };

    return this.documentService.upload(
      dto,
      file,
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Get()
  @RequirePermissions('document.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.documentService.findAll({
      page,
      limit,
      search,
      category,
      status,
      entityType,
      entityId,
    });
  }

  @Get(':id')
  @RequirePermissions('document.read')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentService.findOne(id, user.employeeId ?? user.id);
  }

  @Get(':id/download')
  @RequirePermissions('document.read')
  async download(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const { buffer, mimeType, filename } = await this.documentService.download(
      id,
      user.employeeId ?? user.id,
      user.email,
    );
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    res.send(buffer);
  }

  @Patch(':id/status')
  @RequirePermissions('document.verify')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: DocumentStatus,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.documentService.updateStatus(
      id,
      status,
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Delete(':id')
  @RequirePermissions('document.approve')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.documentService.remove(
      id,
      user.employeeId ?? user.id,
      user.email,
    );
  }
}
