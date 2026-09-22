import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';

function generateReservationNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `RES-${timestamp}-${random}`;
}

function generateCustomerNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CUST-${timestamp}-${random}`;
}

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  /** Public — called by the website reservation form */
  async submitPublicReservation(data: {
    propertyId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    message?: string;
    reservationAmount?: number;
  }) {
    if (!data.email || !data.phone) {
      throw new BadRequestException('Email and phone are required');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: data.propertyId, deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        reservationAmount: true,
        listingPrice: true,
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== 'PUBLISHED') {
      throw new BadRequestException(
        'This property is not currently available for reservation',
      );
    }

    // Check for existing pending reservation on this property by same email
    const existing = await this.prisma.customer.findFirst({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) {
      const pendingRes = await this.prisma.reservation.findFirst({
        where: {
          customerId: existing.id,
          propertyId: data.propertyId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });
      if (pendingRes) {
        throw new ConflictException(
          'You already have an active reservation for this property',
        );
      }
    }

    // Find or create customer
    let customerId: string;
    if (existing) {
      customerId = existing.id;
    } else {
      const customer = await this.prisma.customer.create({
        data: {
          customerNumber: generateCustomerNumber(),
          type: 'INDIVIDUAL',
          status: 'PROSPECT',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone,
          leadSource: 'Website Reservation',
        },
      });
      customerId = customer.id;
    }

    const amount = data.reservationAmount
      ? data.reservationAmount
      : property.reservationAmount
        ? Number(property.reservationAmount)
        : 0;

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const reservation = await this.prisma.reservation.create({
      data: {
        reservationNumber: generateReservationNumber(),
        propertyId: data.propertyId,
        customerId,
        status: 'PENDING',
        reservationAmount: amount,
        expiresAt,
        notes: data.message ?? null,
      },
      include: {
        property: { select: { id: true, title: true, state: true } },
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    await this.auditService.log({
      actorEmail: data.email,
      action: 'CREATE',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      entityLabel: `${reservation.reservationNumber} — ${property.title}`,
      newValues: { source: 'Website', propertyId: data.propertyId },
    });

    // Send confirmation email (non-blocking)
    this.emailService
      .sendReservationConfirmation(data.email, {
        firstName: data.firstName,
        reservationNumber: reservation.reservationNumber,
        propertyTitle: property.title,
        expiresAt: reservation.expiresAt,
      })
      .catch(() => {});

    // Alert the company inbox about the new reservation (non-blocking).
    this.emailService
      .sendNewReservationAdminNotification({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        reservationNumber: reservation.reservationNumber,
        propertyTitle: property.title,
      })
      .catch(() => {});

    return {
      success: true,
      message:
        'Your reservation request has been submitted. Our team will contact you shortly.',
      reservationNumber: reservation.reservationNumber,
    };
  }

  /** Admin — list all reservations with filters */
  async findAll(query: {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
    propertyId?: string;
  }) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const VALID_STATUSES = new Set([
      'PENDING',
      'CONFIRMED',
      'EXPIRED',
      'CANCELLED',
      'CONVERTED_TO_SALE',
    ]);

    const where: Record<string, unknown> = {
      ...(query.status &&
        VALID_STATUSES.has(query.status) && { status: query.status }),
      ...(query.propertyId && { propertyId: query.propertyId }),
      ...(query.search && {
        OR: [
          {
            reservationNumber: { contains: query.search, mode: 'insensitive' },
          },
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
      this.prisma.reservation.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              state: true,
              city: true,
              listingPrice: true,
            },
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.reservation.count({ where }),
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

  /** Admin — get single reservation */
  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            state: true,
            city: true,
            listingPrice: true,
            reservationAmount: true,
            category: true,
            type: true,
            media: { where: { isCover: true }, take: 1, select: { url: true } },
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
            status: true,
          },
        },
      },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');
    return reservation;
  }

  /** Admin — update reservation status */
  async updateStatus(
    id: string,
    status: string,
    notes?: string,
    staffId?: string,
  ) {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['CANCELLED', 'CONVERTED_TO_SALE', 'EXPIRED'],
      EXPIRED: [],
      CANCELLED: [],
      CONVERTED_TO_SALE: [],
    };

    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    const allowed = VALID_TRANSITIONS[reservation.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${reservation.status} to ${status}`,
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: status as never,
        notes: notes ?? reservation.notes,
        ...(status === 'CONFIRMED' && { confirmedAt: new Date() }),
        ...(status === 'CANCELLED' && {
          cancelledAt: new Date(),
          cancellationReason: notes ?? null,
        }),
      },
    });

    if (status === 'CONVERTED_TO_SALE') {
      const existingSale = await this.prisma.sale.findFirst({
        where: { reservationId: reservation.id },
      });
      if (!existingSale) {
        const prop = await this.prisma.property.findUnique({
          where: { id: reservation.propertyId },
          select: { listingPrice: true },
        });
        const salePrice = prop?.listingPrice ? Number(prop.listingPrice) : 0;
        const paid = Number(reservation.reservationAmount);
        const ts = Date.now().toString(36).toUpperCase();
        const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
        await this.prisma.sale.create({
          data: {
            saleNumber: `SALE-${ts}-${rnd}`,
            propertyId: reservation.propertyId,
            customerId: reservation.customerId,
            reservationId: reservation.id,
            type: 'OUTRIGHT',
            status: 'DRAFT',
            salePrice,
            discountAmount: 0,
            finalPrice: salePrice,
            totalPaid: paid,
            balanceDue: Math.max(0, salePrice - paid),
          },
        });
      }
    }

    await this.auditService.log({
      actorId: staffId,
      action: 'STATUS_CHANGE',
      entityType: 'RESERVATION',
      entityId: id,
      entityLabel: reservation.reservationNumber,
      oldValues: { status: reservation.status },
      newValues: { status },
    });

    // Notify customer of status change (non-blocking)
    const customer = await this.prisma.customer.findUnique({
      where: { id: reservation.customerId },
      select: { email: true, firstName: true },
    });
    const property = await this.prisma.property.findUnique({
      where: { id: reservation.propertyId },
      select: { title: true },
    });
    if (customer && property) {
      this.emailService
        .sendReservationStatusUpdate(customer.email, {
          firstName: customer.firstName ?? 'Customer',
          reservationNumber: reservation.reservationNumber,
          propertyTitle: property.title,
          newStatus: status,
          notes,
        })
        .catch(() => {});
    }

    return updated;
  }

  /** Customer — get their own reservations */
  async findMyReservations(customerId: string) {
    return this.prisma.reservation.findMany({
      where: { customerId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            state: true,
            city: true,
            listingPrice: true,
            category: true,
            media: { where: { isCover: true }, take: 1, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTimeline(reservationId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityType: 'RESERVATION', entityId: reservationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        action: true,
        actorEmail: true,
        oldValues: true,
        newValues: true,
        createdAt: true,
      },
    });
    return { items: logs };
  }
}
