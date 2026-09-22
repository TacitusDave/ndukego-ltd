import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

function generateSaleNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SALE-${timestamp}-${random}`;
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'DISPUTED', 'CANCELLED'],
  DISPUTED: ['ACTIVE', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class SaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const VALID_STATUSES = new Set(Object.keys(VALID_TRANSITIONS));

    const where: Record<string, unknown> = {
      deletedAt: null,
      ...(query.status &&
        VALID_STATUSES.has(query.status) && { status: query.status }),
      ...(query.search && {
        OR: [
          { saleNumber: { contains: query.search, mode: 'insensitive' } },
          {
            customer: {
              email: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            customer: {
              firstName: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            customer: {
              lastName: { contains: query.search, mode: 'insensitive' },
            },
          },
          {
            property: {
              title: { contains: query.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          property: {
            select: { id: true, title: true, state: true, city: true },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          reservation: { select: { reservationNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id, deletedAt: null },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            state: true,
            city: true,
            category: true,
            type: true,
          },
        },
        customer: {
          select: {
            id: true,
            customerNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            whatsapp: true,
          },
        },
        reservation: {
          select: {
            id: true,
            reservationNumber: true,
            reservationAmount: true,
          },
        },
        salesAgent: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async create(data: {
    propertyId: string;
    customerId: string;
    reservationId?: string;
    type?: string;
    salePrice: number;
    discountAmount?: number;
    installmentMonths?: number;
    downPayment?: number;
    notes?: string;
    salesAgentId?: string;
    createdById?: string;
  }) {
    const discount = data.discountAmount ?? 0;
    const finalPrice = data.salePrice - discount;

    const sale = await this.prisma.sale.create({
      data: {
        saleNumber: generateSaleNumber(),
        propertyId: data.propertyId,
        customerId: data.customerId,
        reservationId: data.reservationId ?? null,
        type: (data.type ?? 'OUTRIGHT') as never,
        status: 'DRAFT',
        salePrice: data.salePrice,
        discountAmount: discount,
        finalPrice,
        totalPaid: 0,
        balanceDue: finalPrice,
        installmentMonths: data.installmentMonths ?? null,
        downPayment: data.downPayment ?? null,
        notes: data.notes ?? null,
        salesAgentId: data.salesAgentId ?? null,
      },
    });

    await this.auditService.log({
      actorId: data.createdById,
      action: 'CREATE',
      entityType: 'SALE',
      entityId: sale.id,
      entityLabel: sale.saleNumber,
      newValues: { propertyId: data.propertyId, customerId: data.customerId },
    });

    return sale;
  }

  async updateStatus(
    id: string,
    status: string,
    notes?: string,
    staffId?: string,
  ) {
    const sale = await this.prisma.sale.findUnique({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');

    const allowed = VALID_TRANSITIONS[sale.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${sale.status} to ${status}`,
      );
    }

    const updated = await this.prisma.sale.update({
      where: { id },
      data: {
        status: status as never,
        ...(status === 'APPROVED' && {
          approvedAt: new Date(),
          approvedById: staffId ?? null,
        }),
        ...(notes && { notes }),
      },
    });

    await this.auditService.log({
      actorId: staffId,
      action: 'STATUS_CHANGE',
      entityType: 'SALE',
      entityId: id,
      entityLabel: sale.saleNumber,
      oldValues: { status: sale.status },
      newValues: { status },
    });

    return updated;
  }
}
