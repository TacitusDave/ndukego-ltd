import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { StorageService } from '../storage/storage.service';
import { generateReference, slugify, isValidPropertyStatusTransition, calculatePagination } from '@nhgp/lib';
import { PropertyStatus, Prisma } from '@nhgp/database';
import { AuthenticatedUser } from '@nhgp/types';

function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly storage: StorageService,
  ) {}

  async create(data: Prisma.PropertyCreateInput & { estateId?: string; developmentId?: string }, user: AuthenticatedUser) {
    const count = await this.prisma.property.count();
    const internalNumber = generateReference('PROP');
    const slug = slugify(data.title) + '-' + Date.now().toString(36);

    const property = await this.prisma.property.create({
      data: {
        internalNumber,
        slug,
        title: data.title,
        category: data.category as never,
        type: data.type as never,
        state: data.state,
        lga: data.lga,
        city: data.city,
        description: data.description,
        shortDescription: data.shortDescription,
        listingPrice: data.listingPrice,
        landSize: data.landSize,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        installmentAllowed: data.installmentAllowed ?? false,
        reservationAmount: data.reservationAmount,
        estate: data.estateId ? { connect: { id: data.estateId } } : undefined,
        development: data.developmentId ? { connect: { id: data.developmentId } } : undefined,
        createdById: user.employeeId ?? user.id,
        statusHistory: {
          create: { toStatus: 'DRAFT', changedById: user.employeeId ?? user.id, reason: 'Property created' },
        },
      },
      include: { estate: true, development: true },
    });

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'PROPERTY',
      entityId: property.id,
      entityLabel: property.title,
      newValues: { internalNumber, title: property.title, status: 'DRAFT' },
    });

    return property;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: PropertyStatus;
    category?: string;
    type?: string;
    state?: string;
    estateId?: string;
    featured?: boolean;
    publicOnly?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip } = calculatePagination(page, limit, 0);

    const VALID_CATEGORIES = new Set([
      'LAND','HOUSE','DUPLEX','BUNGALOW','APARTMENT','COMMERCIAL','WAREHOUSE',
      'OFFICE','SHOP','HOTEL','ESTATE_PLOT','FARM_LAND','MIXED_USE','INDUSTRIAL',
      'LUXURY_HOME','PROJECT_DEVELOPMENT',
    ]);
    const VALID_TYPES = new Set([
      'RESIDENTIAL','COMMERCIAL','INDUSTRIAL','AGRICULTURAL','INVESTMENT','MIXED_USE',
    ]);

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      ...(query.publicOnly && { status: 'PUBLISHED' }),
      ...(query.status && { status: query.status }),
      ...(query.category && VALID_CATEGORIES.has(query.category) && { category: query.category as never }),
      ...(query.type && VALID_TYPES.has(query.type) && { type: query.type as never }),
      ...(query.estateId && { estateId: query.estateId }),
      ...(query.state && { state: { equals: query.state, mode: 'insensitive' } }),
      ...(query.featured !== undefined && { featured: query.featured }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { internalNumber: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
          { state: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        include: {
          estate: { select: { id: true, name: true, slug: true } },
          development: { select: { id: true, name: true, slug: true } },
          media: { where: { isCover: true }, take: 1 },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return { items, meta: calculatePagination(page, limit, total) };
  }

  async findOne(id: string, incrementView = false) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: {
        estate: true,
        development: true,
        building: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        media: { orderBy: { sortOrder: 'asc' } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        inspections: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    if (incrementView && property.status === 'PUBLISHED') {
      await this.prisma.property.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    }

    return property;
  }

  async update(id: string, data: Partial<Prisma.PropertyUpdateInput>, user: AuthenticatedUser) {
    const existing = await this.findOne(id);

    if (existing.status === 'SOLD') {
      throw new ForbiddenException('Sold properties cannot be modified (Rule 2)');
    }

    const hasExplicitCoords =
      (data as Record<string, unknown>).latitude != null &&
      (data as Record<string, unknown>).longitude != null;
    if (!hasExplicitCoords && data.mapUrl && typeof data.mapUrl === 'string') {
      const coords = extractCoordsFromUrl(data.mapUrl);
      if (coords) {
        (data as Record<string, unknown>).latitude = coords.lat;
        (data as Record<string, unknown>).longitude = coords.lng;
      }
    }

    const property = await this.prisma.property.update({
      where: { id },
      data: { ...data, updatedById: user.employeeId ?? user.id } as Prisma.PropertyUpdateInput,
    });

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'PROPERTY',
      entityId: id,
      entityLabel: property.title,
      oldValues: { title: existing.title, status: existing.status },
      newValues: data as Record<string, unknown>,
    });

    return property;
  }

  async transitionStatus(id: string, toStatus: PropertyStatus, reason: string | undefined, user: AuthenticatedUser) {
    const property = await this.findOne(id);

    if (property.status === 'SOLD' && toStatus !== 'ARCHIVED') {
      throw new ForbiddenException('Sold property cannot return to available status (Rule 2)');
    }

    if (!isValidPropertyStatusTransition(property.status, toStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${property.status} to ${toStatus}`,
      );
    }

    if (toStatus === 'PUBLISHED') {
      await this.validatePublishRequirements(id);
    }

    if (toStatus === 'ARCHIVED' && !user.permissions.includes('property.archive')) {
      throw new ForbiddenException('Only management can archive properties (Rule 3)');
    }

    if (toStatus === 'APPROVED' && !user.permissions.includes('property.approve')) {
      throw new ForbiddenException('Only verified employees may approve listings (Rule 4)');
    }

    const updateData: Prisma.PropertyUpdateInput = {
      status: toStatus,
      updatedById: user.employeeId ?? user.id,
      statusHistory: {
        create: {
          fromStatus: property.status,
          toStatus,
          reason,
          changedById: user.employeeId ?? user.id,
        },
      },
    };

    if (toStatus === 'PUBLISHED') {
      updateData.publishedAt = new Date();
      updateData.publishedById = user.employeeId ?? user.id;
    }
    if (toStatus === 'ARCHIVED') {
      updateData.archivedAt = new Date();
    }
    if (toStatus === 'APPROVED') {
      updateData.approvedById = user.employeeId ?? user.id;
    }

    const updated = await this.prisma.property.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'STATUS_CHANGE',
      entityType: 'PROPERTY',
      entityId: id,
      entityLabel: property.title,
      oldValues: { status: property.status },
      newValues: { status: toStatus, reason },
    });

    return updated;
  }

  private async validatePublishRequirements(propertyId: string) {
    // Phase 1: only require at least one photo.
    // Document and inspection checks will be re-enabled in Phase 2
    // once those admin UI modules are built.
    const media = await this.prisma.propertyMedia.count({ where: { propertyId } });

    if (media < 1) {
      throw new BadRequestException({
        message: 'Property cannot be published (Rule 1)',
        requirements: ['At least one photograph must be uploaded before publishing'],
      });
    }
  }

  async softDelete(id: string, user: AuthenticatedUser) {
    const property = await this.findOne(id);
    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'DELETE',
      entityType: 'PROPERTY',
      entityId: id,
      entityLabel: property.title,
    });

    return { success: true };
  }

  async hardDelete(id: string, user: AuthenticatedUser) {
    const property = await this.findOne(id);

    // Delete all media files from storage first
    const mediaRecords = await this.prisma.propertyMedia.findMany({ where: { propertyId: id } });
    await Promise.allSettled(
      mediaRecords.map((m) => this.storage.delete(m.url.replace('/uploads/', ''))),
    );

    // Delete related records that don't have CASCADE, then delete the property
    await this.prisma.$transaction([
      this.prisma.reservation.deleteMany({ where: { propertyId: id } }),
      this.prisma.sale.deleteMany({ where: { propertyId: id } }),
      this.prisma.inspection.deleteMany({ where: { propertyId: id } }),
      this.prisma.appointment.deleteMany({ where: { propertyId: id } }),
      this.prisma.property.delete({ where: { id } }),
    ]);

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'DELETE',
      entityType: 'PROPERTY',
      entityId: id,
      entityLabel: property.title,
      newValues: { permanent: true },
    });

    return { success: true };
  }

  async addMedia(
    propertyId: string,
    file: Express.Multer.File,
    body: { type?: string; title?: string; isCover?: boolean },
    user: AuthenticatedUser,
  ) {
    await this.findOne(propertyId);

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image must be smaller than 10 MB');
    }

    const ext = extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `properties/${propertyId}/${filename}`;
    await this.storage.store(storagePath, file.buffer);

    const isCover = body.isCover ?? false;

    if (isCover) {
      await this.prisma.propertyMedia.updateMany({
        where: { propertyId },
        data: { isCover: false },
      });
    }

    const existing = await this.prisma.propertyMedia.count({ where: { propertyId } });

    const media = await this.prisma.propertyMedia.create({
      data: {
        propertyId,
        type: body.type || 'IMAGE',
        url: `/uploads/properties/${propertyId}/${filename}`,
        title: body.title,
        isCover: isCover || existing === 0,
        sortOrder: existing,
      },
    });

    return media;
  }

  async deleteMedia(propertyId: string, mediaId: string) {
    const media = await this.prisma.propertyMedia.findFirst({
      where: { id: mediaId, propertyId },
    });
    if (!media) throw new NotFoundException('Media not found');

    await this.storage.delete(media.url.replace('/uploads/', '')).catch(() => undefined);
    await this.prisma.propertyMedia.delete({ where: { id: mediaId } });

    if (media.isCover) {
      const next = await this.prisma.propertyMedia.findFirst({
        where: { propertyId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.propertyMedia.update({ where: { id: next.id }, data: { isCover: true } });
      }
    }

    return { success: true };
  }

  async setCoverMedia(propertyId: string, mediaId: string) {
    const media = await this.prisma.propertyMedia.findFirst({
      where: { id: mediaId, propertyId },
    });
    if (!media) throw new NotFoundException('Media not found');

    await this.prisma.propertyMedia.updateMany({ where: { propertyId }, data: { isCover: false } });
    await this.prisma.propertyMedia.update({ where: { id: mediaId }, data: { isCover: true } });

    return { success: true };
  }

  async submitInquiry(data: {
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    message?: string;
    propertyId?: string;
    propertyTitle?: string;
  }) {
    if (!data.email || !data.phone) {
      throw new BadRequestException('Email and phone are required');
    }

    const note = [
      data.propertyTitle ? `Inquiry about: ${data.propertyTitle}` : 'General property inquiry',
      data.message ? `Message: ${data.message}` : '',
    ].filter(Boolean).join('\n');

    const existing = await this.prisma.customer.findFirst({ where: { email: data.email } });

    let customerId: string;

    if (!existing) {
      const customerNumber = generateReference('CUST');
      const created = await this.prisma.customer.create({
        data: {
          customerNumber,
          type: 'INDIVIDUAL',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          leadSource: 'Website',
          notes: note,
        },
      });
      customerId = created.id;
    } else {
      const updatedNotes = existing.notes
        ? `${existing.notes}\n\n---\n${note}`
        : note;
      await this.prisma.customer.update({
        where: { id: existing.id },
        data: { notes: updatedNotes },
      });
      customerId = existing.id;
    }

    // Always record a dedicated Inquiry entry
    await this.prisma.inquiry.create({
      data: {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email,
        phone: data.phone,
        message: data.message || null,
        propertyId: data.propertyId || null,
        propertyTitle: data.propertyTitle || null,
        status: 'NEW',
      },
    });

    await this.auditService.log({
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: customerId,
      entityLabel: [data.firstName, data.lastName].filter(Boolean).join(' ') || data.email,
      newValues: { source: 'Website inquiry', propertyId: data.propertyId ?? null },
    });

    this.emailService.sendInquiryConfirmation(data.email, {
      firstName: data.firstName ?? 'there',
      propertyTitle: data.propertyTitle,
    }).catch(() => {});

    return { success: true, message: 'Your inquiry has been received. We will be in touch shortly.' };
  }

  async toggleFavorite(propertyId: string, customerId: string): Promise<{ isFavorited: boolean }> {
    const existing = await this.prisma.propertyFavorite.findFirst({
      where: { propertyId, customerId },
    });
    if (existing) {
      await this.prisma.propertyFavorite.delete({ where: { id: existing.id } });
      return { isFavorited: false };
    }
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    await this.prisma.propertyFavorite.create({ data: { propertyId, customerId } });
    return { isFavorited: true };
  }

  async getFavoriteStatus(propertyId: string, customerId: string): Promise<{ isFavorited: boolean }> {
    const existing = await this.prisma.propertyFavorite.findFirst({
      where: { propertyId, customerId },
    });
    return { isFavorited: !!existing };
  }

  async getInquiries(query: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip } = calculatePagination(page, limit, 0);

    const searchPattern = query.search ? `%${query.search}%` : null;
    const status = query.status ?? null;

    const items = await this.prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, first_name as "firstName", last_name as "lastName", email, phone, message,
              property_id as "propertyId", property_title as "propertyTitle", status,
              staff_notes as "staffNotes", created_at as "createdAt", updated_at as "updatedAt"
       FROM inquiries
       WHERE ($1::text IS NULL OR status = $1)
         AND ($2::text IS NULL OR (
           email ILIKE $2 OR first_name ILIKE $2 OR last_name ILIKE $2
           OR phone ILIKE $2 OR property_title ILIKE $2
         ))
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      status,
      searchPattern,
      limit,
      skip,
    );

    const [countRow] = await this.prisma.$queryRawUnsafe<{ count: string }[]>(
      `SELECT COUNT(*)::text as count FROM inquiries
       WHERE ($1::text IS NULL OR status = $1)
         AND ($2::text IS NULL OR (
           email ILIKE $2 OR first_name ILIKE $2 OR last_name ILIKE $2
           OR phone ILIKE $2 OR property_title ILIKE $2
         ))`,
      status,
      searchPattern,
    );

    const total = parseInt(countRow?.count ?? '0', 10);
    return { items, meta: calculatePagination(page, limit, total) };
  }

  async updateInquiryStatus(id: string, status: string) {
    const VALID = ['NEW', 'CONTACTED', 'CONVERTED', 'CLOSED'];
    if (!VALID.includes(status)) throw new BadRequestException('Invalid status');
    const result = await this.prisma.$executeRawUnsafe(
      `UPDATE inquiries SET status = $1, updated_at = now() WHERE id = $2::uuid`,
      status,
      id,
    );
    if (result === 0) throw new NotFoundException('Inquiry not found');
    return { success: true, status };
  }

  async updateInquiryNotes(id: string, staffNotes: string) {
    const result = await this.prisma.$executeRawUnsafe(
      `UPDATE inquiries SET staff_notes = $1, updated_at = now() WHERE id = $2::uuid`,
      staffNotes,
      id,
    );
    if (result === 0) throw new NotFoundException('Inquiry not found');
    return { success: true };
  }

  async convertInquiryToReservation(inquiryId: string, user: AuthenticatedUser) {
    const rows = await this.prisma.$queryRawUnsafe<{
      id: string; propertyId: string | null; email: string;
      firstName: string | null; lastName: string | null;
      phone: string; message: string | null; status: string;
    }[]>(
      `SELECT id, property_id as "propertyId", email, first_name as "firstName",
              last_name as "lastName", phone, message, status
       FROM inquiries WHERE id = $1::uuid`,
      inquiryId,
    );
    const inquiry = rows[0];
    if (!inquiry) throw new NotFoundException('Inquiry not found');
    if (!inquiry.propertyId) throw new BadRequestException('This inquiry has no associated property — conversion requires a property');
    if (inquiry.status === 'CONVERTED') throw new BadRequestException('This inquiry has already been converted to a reservation');
    if (inquiry.status === 'CLOSED') throw new BadRequestException('Cannot convert a closed inquiry');

    const property = await this.prisma.property.findUnique({
      where: { id: inquiry.propertyId, deletedAt: null },
      select: { id: true, title: true, reservationAmount: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    // Find or create customer record
    let customerId: string;
    const existing = await this.prisma.customer.findFirst({
      where: { email: inquiry.email.toLowerCase() },
    });
    if (existing) {
      customerId = existing.id;
    } else {
      const ts = Date.now().toString(36).toUpperCase();
      const rnd = Math.random().toString(36).substring(2, 6).toUpperCase();
      const customer = await this.prisma.customer.create({
        data: {
          customerNumber: `CUST-${ts}-${rnd}`,
          type: 'INDIVIDUAL',
          status: 'PROSPECT',
          firstName: inquiry.firstName ?? '',
          lastName: inquiry.lastName ?? '',
          email: inquiry.email.toLowerCase(),
          phone: inquiry.phone,
          leadSource: 'Website Inquiry',
        },
      });
      customerId = customer.id;
    }

    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    const reservationNumber = `RES-${ts}-${rnd}`;

    const reservation = await this.prisma.reservation.create({
      data: {
        reservationNumber,
        propertyId: inquiry.propertyId,
        customerId,
        status: 'PENDING',
        reservationAmount: property.reservationAmount ? Number(property.reservationAmount) : 0,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: inquiry.message ?? null,
      },
    });

    await this.prisma.$executeRawUnsafe(
      `UPDATE inquiries SET status = 'CONVERTED', updated_at = now() WHERE id = $1::uuid`,
      inquiryId,
    );

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'RESERVATION',
      entityId: reservation.id,
      entityLabel: `${reservationNumber} — ${property.title}`,
      newValues: { source: 'Converted from inquiry', inquiryId },
    });

    return { reservationId: reservation.id, reservationNumber };
  }
}
