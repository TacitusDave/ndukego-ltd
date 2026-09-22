import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { generateReference, calculatePagination } from '@nhgp/lib';
import {
  InspectionType,
  InspectionStatus,
  InspectionRecommendation,
  Prisma,
} from '@nhgp/database';

export interface ScheduleInspectionDto {
  propertyId: string;
  inspectorId: string;
  customerId?: string;
  type: InspectionType;
  scheduledAt: Date;
  durationMinutes?: number;
  location?: string;
  notes?: string;
}

export interface CompleteInspectionDto {
  recommendation: InspectionRecommendation;
  overallScore?: number;
  summary?: string;
  observations?: Record<string, unknown>;
  defects?: Record<string, unknown>;
  reportUrl?: string;
  notes?: string;
}

const VALID_TRANSITIONS: Record<string, InspectionStatus[]> = {
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

@Injectable()
export class InspectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async schedule(
    dto: ScheduleInspectionDto,
    actorId: string,
    actorEmail: string,
  ) {
    const inspectionNumber = generateReference('INSP');

    const inspection = await this.prisma.inspection.create({
      data: {
        inspectionNumber,
        propertyId: dto.propertyId,
        inspectorId: dto.inspectorId,
        customerId: dto.customerId,
        type: dto.type,
        scheduledAt: dto.scheduledAt,
        notes: dto.notes,
        status: 'SCHEDULED',
      },
      include: {
        property: {
          select: { id: true, title: true, state: true, city: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        inspector: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
      },
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'CREATE',
      entityType: 'INSPECTION',
      entityId: inspection.id,
      entityLabel: inspectionNumber,
      newValues: {
        inspectionNumber,
        type: dto.type,
        propertyId: dto.propertyId,
        scheduledAt: dto.scheduledAt,
      },
    });

    return inspection;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    inspectorId?: string;
    propertyId?: string;
  }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const skip = (page - 1) * limit;

    const where: Prisma.InspectionWhereInput = {
      ...(query.status ? { status: query.status as InspectionStatus } : {}),
      ...(query.type ? { type: query.type as InspectionType } : {}),
      ...(query.inspectorId ? { inspectorId: query.inspectorId } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                inspectionNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                property: {
                  title: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                inspector: {
                  firstName: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                inspector: {
                  lastName: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.inspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          property: {
            select: { id: true, title: true, state: true, city: true },
          },
          customer: { select: { id: true, firstName: true, lastName: true } },
          inspector: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jobTitle: true,
            },
          },
        },
      }),
      this.prisma.inspection.count({ where }),
    ]);

    const { totalPages } = calculatePagination(page, limit, total);
    return { items, meta: { page, limit, total, totalPages } };
  }

  async findOne(id: string) {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            state: true,
            city: true,
            category: true,
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
        inspector: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            email: true,
          },
        },
      },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    return inspection;
  }

  async start(id: string, actorId: string, actorEmail: string) {
    const inspection = await this.findOne(id);
    if (!VALID_TRANSITIONS[inspection.status]?.includes('IN_PROGRESS')) {
      throw new BadRequestException(
        `Cannot start an inspection with status ${inspection.status}`,
      );
    }

    const updated = await this.prisma.inspection.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'STATUS_CHANGE',
      entityType: 'INSPECTION',
      entityId: id,
      entityLabel: inspection.inspectionNumber,
      oldValues: { status: inspection.status },
      newValues: { status: 'IN_PROGRESS' },
    });

    return updated;
  }

  async complete(
    id: string,
    dto: CompleteInspectionDto,
    actorId: string,
    actorEmail: string,
  ) {
    const inspection = await this.findOne(id);
    if (!VALID_TRANSITIONS[inspection.status]?.includes('COMPLETED')) {
      throw new BadRequestException(
        `Cannot complete an inspection with status ${inspection.status}`,
      );
    }

    const updated = await this.prisma.inspection.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        recommendation: dto.recommendation,
        overallScore:
          dto.overallScore != null
            ? new Prisma.Decimal(dto.overallScore)
            : undefined,
        summary: dto.summary,
        observations: dto.observations as never,
        defects: dto.defects as never,
        reportUrl: dto.reportUrl,
        notes: dto.notes ?? inspection.notes,
      },
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'STATUS_CHANGE',
      entityType: 'INSPECTION',
      entityId: id,
      entityLabel: inspection.inspectionNumber,
      oldValues: { status: inspection.status },
      newValues: { status: 'COMPLETED', recommendation: dto.recommendation },
    });

    return updated;
  }

  async cancel(
    id: string,
    reason: string,
    actorId: string,
    actorEmail: string,
  ) {
    const inspection = await this.findOne(id);
    if (!VALID_TRANSITIONS[inspection.status]?.includes('CANCELLED')) {
      throw new BadRequestException(
        `Cannot cancel an inspection with status ${inspection.status}`,
      );
    }

    const updated = await this.prisma.inspection.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason || inspection.notes },
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'STATUS_CHANGE',
      entityType: 'INSPECTION',
      entityId: id,
      entityLabel: inspection.inspectionNumber,
      oldValues: { status: inspection.status },
      newValues: { status: 'CANCELLED', reason },
    });

    return updated;
  }

  async fail(id: string, reason: string, actorId: string, actorEmail: string) {
    const inspection = await this.findOne(id);
    if (!VALID_TRANSITIONS[inspection.status]?.includes('FAILED')) {
      throw new BadRequestException(
        `Cannot fail an inspection with status ${inspection.status}`,
      );
    }

    const updated = await this.prisma.inspection.update({
      where: { id },
      data: { status: 'FAILED', notes: reason || inspection.notes },
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'STATUS_CHANGE',
      entityType: 'INSPECTION',
      entityId: id,
      entityLabel: inspection.inspectionNumber,
      oldValues: { status: inspection.status },
      newValues: { status: 'FAILED', reason },
    });

    return updated;
  }
}
