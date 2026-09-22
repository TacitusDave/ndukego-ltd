import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { calculatePagination, generateReference } from '@nhgp/lib';
import { AuthenticatedUser } from '@nhgp/types';
import { Prisma } from '@nhgp/database';

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Record<string, unknown>, user: AuthenticatedUser) {
    const customerNumber = generateReference('CUST');

    const customer = await this.prisma.customer.create({
      data: {
        customerNumber,
        type: (data.type as never) ?? 'INDIVIDUAL',
        firstName: data.firstName as string | undefined,
        lastName: data.lastName as string | undefined,
        middleName: data.middleName as string | undefined,
        companyName: data.companyName as string | undefined,
        email: data.email as string,
        phone: data.phone as string,
        whatsapp: data.whatsapp as string | undefined,
        alternatePhone: data.alternatePhone as string | undefined,
        address: data.address as string | undefined,
        city: data.city as string | undefined,
        state: data.state as string | undefined,
        country: (data.country as string) ?? 'Nigeria',
        occupation: data.occupation as string | undefined,
        nationality: (data.nationality as string) ?? 'Nigerian',
        leadSource: data.leadSource as string | undefined,
        notes: data.notes as string | undefined,
        createdById: user.employeeId ?? user.id,
      },
    });

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityLabel: this.customerLabel(customer),
    });

    return customer;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    kycStatus?: string;
    leadSource?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const { skip } = calculatePagination(page, limit, 0);

    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status as never }),
      ...(query.type && { type: query.type as never }),
      ...(query.kycStatus && { kycStatus: query.kycStatus as never }),
      ...(query.leadSource && { leadSource: query.leadSource }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { companyName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search, mode: 'insensitive' } },
          { customerNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          customerNumber: true,
          type: true,
          status: true,
          kycStatus: true,
          firstName: true,
          lastName: true,
          companyName: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          leadSource: true,
          createdAt: true,
          _count: { select: { reservations: true, sales: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, meta: calculatePagination(page, limit, total) };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        reservations: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            reservationNumber: true,
            status: true,
            reservationAmount: true,
            reservedAt: true,
            confirmedAt: true,
            cancelledAt: true,
            property: {
              select: { id: true, title: true, state: true, city: true },
            },
          },
        },
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            saleNumber: true,
            status: true,
            type: true,
            finalPrice: true,
            totalPaid: true,
            balanceDue: true,
            createdAt: true,
            property: {
              select: { id: true, title: true, state: true, city: true },
            },
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(
    id: string,
    data: Record<string, unknown>,
    user: AuthenticatedUser,
  ) {
    await this.findOne(id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: data as Prisma.CustomerUpdateInput,
    });

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityLabel: this.customerLabel(customer),
    });

    return customer;
  }

  async deactivate(id: string, user: AuthenticatedUser) {
    const customer = await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { status: 'INACTIVE' as never },
    });
    await this.prisma.user.updateMany({
      where: { customerId: id },
      data: { status: 'INACTIVE' as never },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityLabel: this.customerLabel(customer),
      newValues: { status: 'INACTIVE' },
    });
    return { success: true };
  }

  async activate(id: string, user: AuthenticatedUser) {
    const customer = await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { status: 'ACTIVE' as never },
    });
    await this.prisma.user.updateMany({
      where: { customerId: id },
      data: { status: 'ACTIVE' as never },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityLabel: this.customerLabel(customer),
      newValues: { status: 'ACTIVE' },
    });
    return { success: true };
  }

  async softDelete(id: string, user: AuthenticatedUser) {
    const customer = await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' as never },
    });
    await this.prisma.user.updateMany({
      where: { customerId: id },
      data: { status: 'INACTIVE' as never, deletedAt: new Date() },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'DELETE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityLabel: this.customerLabel(customer),
    });
    return { success: true };
  }

  private customerLabel(c: {
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    email: string;
  }) {
    if (c.firstName || c.lastName)
      return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim();
    return c.companyName ?? c.email;
  }
}
