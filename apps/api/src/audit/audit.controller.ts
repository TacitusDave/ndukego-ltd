import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditAction, EntityType } from '@nhgp/database';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit.read')
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('entityType') entityType?: EntityType,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: AuditAction,
  ) {
    return this.auditService.findAll({
      page,
      limit,
      entityType,
      entityId,
      actorId,
      action,
    });
  }
}
