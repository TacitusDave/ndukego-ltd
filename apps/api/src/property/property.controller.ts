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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PropertyService } from './property.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermissions,
  Public,
} from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';
import { PropertyStatus } from '@nhgp/database';

@Controller('properties')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Public()
  @Get('public')
  findPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('state') state?: string,
    @Query('estateId') estateId?: string,
    @Query('featured') featured?: boolean,
  ) {
    return this.propertyService.findAll({
      page,
      limit,
      search,
      category,
      type,
      state,
      estateId,
      featured,
      publicOnly: true,
    });
  }

  @Public()
  @Get('public/:id')
  findPublicOne(@Param('id') id: string) {
    return this.propertyService.findOne(id, true);
  }

  @Public()
  @Post('public/inquiry')
  submitInquiry(@Body() body: Record<string, unknown>) {
    return this.propertyService.submitInquiry(body as never);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @RequirePermissions('property.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: PropertyStatus,
    @Query('category') category?: string,
    @Query('estateId') estateId?: string,
  ) {
    return this.propertyService.findAll({
      page,
      limit,
      search,
      status,
      category,
      estateId,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get('admin/inquiries')
  @RequirePermissions('property.read')
  getInquiries(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.propertyService.getInquiries({ page, limit, search, status });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('admin/inquiries/:id/status')
  @RequirePermissions('property.update')
  updateInquiryStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.propertyService.updateInquiryStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch('admin/inquiries/:id/notes')
  @RequirePermissions('property.update')
  updateInquiryNotes(
    @Param('id') id: string,
    @Body() body: { staffNotes: string },
  ) {
    return this.propertyService.updateInquiryNotes(id, body.staffNotes ?? '');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post('admin/inquiries/:id/convert')
  @RequirePermissions('property.update')
  convertInquiry(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertyService.convertInquiryToReservation(id, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(':id')
  @RequirePermissions('property.read')
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('property.create')
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertyService.create(body as never, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('property.update')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertyService.update(id, body as never, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':id/status')
  @RequirePermissions('property.update')
  transitionStatus(
    @Param('id') id: string,
    @Body() body: { status: PropertyStatus; reason?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.propertyService.transitionStatus(
      id,
      body.status,
      body.reason,
      user,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @RequirePermissions('property.delete')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.propertyService.softDelete(id, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id/permanent')
  @RequirePermissions('property.delete')
  hardDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.propertyService.hardDelete(id, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':id/media')
  @RequirePermissions('property.update')
  // Memory storage buffers the whole upload in RAM — cap it at the largest
  // media this endpoint accepts (50 MB videos) so a runaway upload can never
  // exhaust the container's memory and take the whole API down.
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 55 * 1024 * 1024 },
    }),
  )
  addMedia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type?: string; title?: string; isCover?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.propertyService.addMedia(
      id,
      file,
      { ...body, isCover: body.isCover === 'true' },
      user,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id/media/:mediaId')
  @RequirePermissions('property.update')
  deleteMedia(@Param('id') id: string, @Param('mediaId') mediaId: string) {
    return this.propertyService.deleteMedia(id, mediaId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/media/:mediaId/cover')
  @RequirePermissions('property.update')
  setCoverMedia(@Param('id') id: string, @Param('mediaId') mediaId: string) {
    return this.propertyService.setCoverMedia(id, mediaId);
  }

  // ─── Customer Favorites ──────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  toggleFavorite(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.customerId) return { isFavorited: false };
    return this.propertyService.toggleFavorite(id, user.customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/favorite-status')
  getFavoriteStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!user.customerId) return { isFavorited: false };
    return this.propertyService.getFavoriteStatus(id, user.customerId);
  }
}
