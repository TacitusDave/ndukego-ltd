import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';

@Controller('companies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @RequirePermissions('company.update')
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.create(body as never, user);
  }

  @Get()
  @RequirePermissions('company.read')
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.companyService.findAll(page, limit);
  }

  @Get('departments')
  @RequirePermissions('company.read')
  findDepartments() {
    return this.companyService.findDepartments();
  }

  @Get(':id')
  @RequirePermissions('company.read')
  findOne(@Param('id') id: string) {
    return this.companyService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('company.update')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.update(id, body as never, user);
  }

  @Post(':id/branches')
  @RequirePermissions('company.update')
  createBranch(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.createBranch(id, body as never, user);
  }

  @Patch('branches/:branchId')
  @RequirePermissions('company.update')
  updateBranch(
    @Param('branchId') branchId: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.updateBranch(branchId, body as never, user);
  }

  @Delete('branches/:branchId')
  @RequirePermissions('company.update')
  deleteBranch(
    @Param('branchId') branchId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.deleteBranch(branchId, user);
  }

  @Post('departments')
  @RequirePermissions('company.update')
  createDepartment(
    @Body()
    body: { name: string; code: string; description?: string; headId?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.createDepartment(body, user);
  }

  @Patch('departments/:id')
  @RequirePermissions('company.update')
  updateDepartment(
    @Param('id') id: string,
    @Body()
    body: { name?: string; description?: string; headId?: string | null },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.updateDepartment(id, body, user);
  }

  @Delete('departments/:id')
  @RequirePermissions('company.update')
  deleteDepartment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.companyService.deleteDepartment(id, user);
  }
}
