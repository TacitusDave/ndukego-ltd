import {
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
import { EstateService } from './estate.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import {
  RequirePermissions,
  Public,
} from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';

@Controller('estates')
export class EstateController {
  constructor(private readonly estateService: EstateService) {}

  @Public()
  @Get('public')
  findPublic(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    return this.estateService.findAll({
      page,
      limit,
      search,
      featured:
        featured === 'true' ? true : featured === 'false' ? false : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @RequirePermissions('estate.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.estateService.findAll({
      page,
      limit,
      search,
      status,
      companyId,
    });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(':id')
  @RequirePermissions('estate.read')
  findOne(@Param('id') id: string) {
    return this.estateService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('estate.create')
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.create(body, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions('estate.update')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.update(id, body as never, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':id/phases')
  @RequirePermissions('estate.update')
  addPhase(
    @Param('id') id: string,
    @Body()
    body: {
      name: string;
      code: string;
      description?: string;
      totalPlots?: number;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.addPhase(id, body, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':id/blocks')
  @RequirePermissions('estate.update')
  addBlock(
    @Param('id') id: string,
    @Body()
    body: { name: string; code: string; section?: string; totalPlots?: number },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.addBlock(id, body, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':id/infrastructure')
  @RequirePermissions('estate.update')
  addInfrastructure(
    @Param('id') id: string,
    @Body() body: { name: string; type: string; description?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.addInfrastructure(id, body, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':id/site-plan')
  @RequirePermissions('estate.update')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadSitePlan(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.uploadSitePlan(id, file, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/building-types')
  @RequirePermissions('estate.update')
  updateBuildingTypes(
    @Param('id') id: string,
    @Body() body: { buildingTypes: unknown[] },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.updateBuildingTypes(id, body.buildingTypes, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post(':id/building-type-image/:typeId')
  @RequirePermissions('estate.update')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadBuildingTypeImage(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.estateService.uploadBuildingTypeImage(id, typeId, file, user);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id/building-type-image/:typeId/:filename')
  @RequirePermissions('estate.update')
  deleteBuildingTypeImage(
    @Param('id') id: string,
    @Param('typeId') typeId: string,
    @Param('filename') filename: string,
  ) {
    return this.estateService.deleteBuildingTypeImage(id, typeId, filename);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id/permanent')
  @RequirePermissions('estate.delete')
  hardDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.estateService.hardDelete(id, user);
  }
}
