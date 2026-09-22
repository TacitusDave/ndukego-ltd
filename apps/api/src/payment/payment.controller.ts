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
import { PaymentService, RecordPaymentDto } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@nhgp/types';
import { PaymentType, PaymentMethod } from '@nhgp/database';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @RequirePermissions('payment.create')
  record(
    @Body()
    body: {
      saleId: string;
      customerId: string;
      type: PaymentType;
      method: PaymentMethod;
      amount: number;
      currency?: string;
      reference?: string;
      bankName?: string;
      transactionDate: string;
      notes?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const dto: RecordPaymentDto = {
      saleId: body.saleId,
      customerId: body.customerId,
      type: body.type,
      method: body.method,
      amount: Number(body.amount),
      currency: body.currency,
      reference: body.reference,
      bankName: body.bankName,
      transactionDate: new Date(body.transactionDate),
      notes: body.notes,
    };
    return this.paymentService.record(
      dto,
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Get()
  @RequirePermissions('payment.read')
  findAll(
    @Query('saleId') saleId?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentService.findAll({
      saleId,
      customerId,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  @RequirePermissions('payment.read')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Patch(':id/verify')
  @RequirePermissions('payment.verify')
  verify(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.paymentService.verify(
      id,
      user.employeeId ?? user.id,
      user.email,
    );
  }

  @Patch(':id/reject')
  @RequirePermissions('payment.verify')
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentService.reject(
      id,
      reason ?? 'No reason provided',
      user.employeeId ?? user.id,
      user.email,
    );
  }
}
