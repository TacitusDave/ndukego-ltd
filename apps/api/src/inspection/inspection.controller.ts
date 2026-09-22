import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  InspectionService,
  ScheduleInspectionDto,
  CompleteInspectionDto,
} from './inspection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';
import { InspectionType } from '@nhgp/database';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inspections')
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
  @RequirePermissions('inspection.create')
  schedule(
    @Body()
    body: {
      propertyId: string;
      inspectorId: string;
      customerId?: string;
      type: InspectionType;
      scheduledAt: string;
      notes?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto: ScheduleInspectionDto = {
      propertyId: body.propertyId,
      inspectorId: body.inspectorId,
      customerId: body.customerId,
      type: body.type,
      scheduledAt: new Date(body.scheduledAt),
      notes: body.notes,
    };
    return this.inspectionService.schedule(
      dto,
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Get()
  @RequirePermissions('inspection.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('inspectorId') inspectorId?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    return this.inspectionService.findAll({
      page,
      limit,
      search,
      status,
      type,
      inspectorId,
      propertyId,
    });
  }

  @Get(':id')
  @RequirePermissions('inspection.read')
  findOne(@Param('id') id: string) {
    return this.inspectionService.findOne(id);
  }

  @Patch(':id/start')
  @RequirePermissions('inspection.update')
  start(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.inspectionService.start(
      id,
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Patch(':id/complete')
  @RequirePermissions('inspection.update')
  complete(
    @Param('id') id: string,
    @Body() body: CompleteInspectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inspectionService.complete(
      id,
      body,
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Patch(':id/cancel')
  @RequirePermissions('inspection.update')
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inspectionService.cancel(
      id,
      reason ?? '',
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Patch(':id/fail')
  @RequirePermissions('inspection.update')
  fail(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inspectionService.fail(
      id,
      reason ?? '',
      user.employeeId ?? user.id,
      user.email,
    );
  }
}
