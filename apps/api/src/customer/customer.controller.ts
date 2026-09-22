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
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';

@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @RequirePermissions('customer.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('kycStatus') kycStatus?: string,
    @Query('leadSource') leadSource?: string,
  ) {
    return this.customerService.findAll({
      page,
      limit,
      search,
      status,
      type,
      kycStatus,
      leadSource,
    });
  }

  @Get(':id')
  @RequirePermissions('customer.read')
  findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Post()
  @RequirePermissions('customer.create')
  create(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customerService.create(body, user);
  }

  @Patch(':id')
  @RequirePermissions('customer.update')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.customerService.update(id, body, user);
  }

  @Post(':id/deactivate')
  @RequirePermissions('customer.update')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customerService.deactivate(id, user);
  }

  @Post(':id/activate')
  @RequirePermissions('customer.update')
  activate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customerService.activate(id, user);
  }

  @Delete(':id')
  @RequirePermissions('customer.update')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.customerService.softDelete(id, user);
  }
}
