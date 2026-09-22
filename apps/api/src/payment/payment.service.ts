import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { generateReference, calculatePagination } from '@nhgp/lib';
import { PaymentType, PaymentMethod, Prisma } from '@nhgp/database';

export interface RecordPaymentDto {
  saleId: string;
  customerId: string;
  type: PaymentType;
  method: PaymentMethod;
  amount: number;
  currency?: string;
  reference?: string;
  bankName?: string;
  transactionDate: Date;
  notes?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async record(
    dto: RecordPaymentDto,
    recordedById: string,
    actorEmail: string,
  ) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const sale = await this.prisma.sale.findFirst({
      where: { id: dto.saleId, deletedAt: null },
    });
    if (!sale) throw new NotFoundException('Sale not found');

    const paymentNumber = generateReference('PAY');
    const receiptNumber = generateReference('RCP');

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          paymentNumber,
          receiptNumber,
          saleId: dto.saleId,
          customerId: dto.customerId,
          type: dto.type,
          method: dto.method,
          amount: new Prisma.Decimal(dto.amount),
          currency: dto.currency ?? 'NGN',
          reference: dto.reference,
          bankName: dto.bankName,
          transactionDate: dto.transactionDate,
          notes: dto.notes,
          recordedById,
          status: 'PENDING_VERIFICATION',
        },
      });

      // Update sale totals optimistically — reversed if payment is later rejected
      await tx.sale.update({
        where: { id: dto.saleId },
        data: {
          totalPaid: { increment: dto.amount },
          balanceDue: { decrement: dto.amount },
        },
      });

      return created;
    });

    await this.auditService.log({
      actorId: recordedById,
      actorEmail,
      action: 'CREATE',
      entityType: 'PAYMENT',
      entityId: payment.id,
      entityLabel: `${paymentNumber} — ₦${dto.amount.toLocaleString()}`,
      newValues: {
        paymentNumber,
        amount: dto.amount,
        type: dto.type,
        method: dto.method,
        saleId: dto.saleId,
      },
    });

    return { ...payment, amount: Number(payment.amount) };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    saleId?: string;
    customerId?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      ...(query.saleId ? { saleId: query.saleId } : {}),
      ...(query.customerId ? { customerId: query.customerId } : {}),
      ...(query.status ? { status: query.status as never } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          recordedBy: { select: { id: true, firstName: true, lastName: true } },
          verifiedBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const { totalPages } = calculatePagination(page, limit, total);

    return {
      items: items.map((p) => ({ ...p, amount: Number(p.amount) })),
      meta: { page, limit, total, totalPages },
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        sale: {
          select: {
            id: true,
            saleNumber: true,
            finalPrice: true,
            balanceDue: true,
          },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        recordedBy: { select: { id: true, firstName: true, lastName: true } },
        verifiedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return { ...payment, amount: Number(payment.amount) };
  }

  async verify(id: string, verifiedById: string, actorEmail: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        `Cannot verify a payment with status ${payment.status}`,
      );
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        verifiedById,
      },
    });

    await this.auditService.log({
      actorId: verifiedById,
      actorEmail,
      action: 'APPROVE',
      entityType: 'PAYMENT',
      entityId: id,
      entityLabel: payment.paymentNumber,
      oldValues: { status: 'PENDING_VERIFICATION' },
      newValues: { status: 'VERIFIED' },
    });

    return { ...updated, amount: Number(updated.amount) };
  }

  async reject(
    id: string,
    reason: string,
    actorId: string,
    actorEmail: string,
  ) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'PENDING_VERIFICATION') {
      throw new BadRequestException(
        `Cannot reject a payment with status ${payment.status}`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason },
      });

      // Reverse the optimistic totals recorded when payment was created
      if (payment.saleId) {
        await tx.sale.update({
          where: { id: payment.saleId },
          data: {
            totalPaid: { decrement: Number(payment.amount) },
            balanceDue: { increment: Number(payment.amount) },
          },
        });
      }

      return p;
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'REJECT',
      entityType: 'PAYMENT',
      entityId: id,
      entityLabel: payment.paymentNumber,
      oldValues: { status: 'PENDING_VERIFICATION' },
      newValues: { status: 'REJECTED', rejectionReason: reason },
    });

    return { ...updated, amount: Number(updated.amount) };
  }
}
