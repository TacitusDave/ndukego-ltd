import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { calculatePagination, slugify } from '@nhgp/lib';
import { AuthenticatedUser } from '@nhgp/types';
import { Prisma } from '@nhgp/database';

function extractCoordsFromUrl(
  url: string,
): { lat: number; lng: number } | null {
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch)
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

@Injectable()
export class EstateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storage: StorageService,
  ) {}

  async create(data: Record<string, unknown>, user: AuthenticatedUser) {
    const slug = slugify(String(data.name)) + '-' + Date.now().toString(36);
    const estate = await this.prisma.estate.create({
      data: {
        companyId: data.companyId as string,
        name: data.name as string,
        code: data.code as string,
        slug,
        description: data.description as string | undefined,
        shortDescription: data.shortDescription as string | undefined,
        state: data.state as string,
        lga: data.lga as string | undefined,
        city: data.city as string | undefined,
        district: data.district as string | undefined,
        community: data.community as string | undefined,
        address: data.address as string | undefined,
        latitude: data.latitude as number | undefined,
        longitude: data.longitude as number | undefined,
        totalLandSize: data.totalLandSize as number | undefined,
        totalPlots: data.totalPlots as number | undefined,
        availablePlots: data.totalPlots as number | undefined,
        createdById: user.employeeId ?? user.id,
      },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'ESTATE',
      entityId: estate.id,
      entityLabel: estate.name,
    });
    return estate;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    companyId?: string;
    featured?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip } = calculatePagination(page, limit, 0);
    const where: Prisma.EstateWhereInput = {
      deletedAt: null,
      ...(query.status && { status: query.status as never }),
      ...(query.companyId && { companyId: query.companyId }),
      ...(query.featured !== undefined && { featured: query.featured }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { city: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.estate.findMany({
        where,
        skip,
        take: limit,
        include: {
          phases: true,
          blocks: true,
          _count: { select: { properties: true } },
        },
      }),
      this.prisma.estate.count({ where }),
    ]);
    return { items, meta: calculatePagination(page, limit, total) };
  }

  async findOne(id: string) {
    const estate = await this.prisma.estate.findFirst({
      where: { id, deletedAt: null },
      include: {
        phases: true,
        blocks: true,
        infrastructure: true,
        properties: { where: { deletedAt: null }, take: 20 },
      },
    });
    if (!estate) throw new NotFoundException('Estate not found');
    return estate;
  }

  async update(
    id: string,
    data: Prisma.EstateUpdateInput,
    user: AuthenticatedUser,
  ) {
    await this.findOne(id);
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
    const estate = await this.prisma.estate.update({
      where: { id },
      data: { ...data, updatedById: user.employeeId ?? user.id },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'ESTATE',
      entityId: id,
      entityLabel: estate.name,
    });
    return estate;
  }

  async addPhase(
    estateId: string,
    data: {
      name: string;
      code: string;
      description?: string;
      totalPlots?: number;
    },
    _user: AuthenticatedUser,
  ) {
    await this.findOne(estateId);
    return this.prisma.estatePhase.create({ data: { estateId, ...data } });
  }

  async addBlock(
    estateId: string,
    data: { name: string; code: string; section?: string; totalPlots?: number },
    _user: AuthenticatedUser,
  ) {
    await this.findOne(estateId);
    return this.prisma.estateBlock.create({ data: { estateId, ...data } });
  }

  async addInfrastructure(
    estateId: string,
    data: { name: string; type: string; description?: string },
    _user: AuthenticatedUser,
  ) {
    await this.findOne(estateId);
    return this.prisma.estateInfrastructure.create({
      data: { estateId, ...data },
    });
  }

  async uploadSitePlan(
    id: string,
    file: Express.Multer.File,
    _user: AuthenticatedUser,
  ) {
    const estate = await this.findOne(id);

    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, or HEIC images are allowed',
      );
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new BadRequestException(
        'Site plan image must be smaller than 20 MB',
      );
    }

    const ext = extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const filename = `site-plan-${uuidv4()}${ext}`;
    const storagePath = `estates/${id}/site-plan/${filename}`;
    await this.storage.store(storagePath, file.buffer);

    const url = `/uploads/estates/${id}/site-plan/${filename}`;

    // Remove old site plan file if it exists
    if (estate.masterPlanUrl) {
      await this.storage
        .delete(estate.masterPlanUrl.replace('/uploads/', ''))
        .catch(() => undefined);
    }

    await this.prisma.estate.update({
      where: { id },
      data: { masterPlanUrl: url },
    });

    return { url };
  }

  async updateBuildingTypes(
    id: string,
    buildingTypes: unknown[],
    _user: AuthenticatedUser,
  ) {
    await this.findOne(id);
    await this.prisma.estate.update({
      where: { id },
      data: { buildingTypesConfig: buildingTypes as Prisma.JsonArray },
    });
    return { success: true };
  }

  async uploadBuildingTypeImage(
    id: string,
    typeId: string,
    file: Express.Multer.File,
    _user: AuthenticatedUser,
  ) {
    await this.findOne(id);

    const allowed = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, or HEIC images are allowed',
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('Image must be smaller than 10 MB');
    }

    const ext = extname(file.originalname) || `.${file.mimetype.split('/')[1]}`;
    const filename = `${uuidv4()}${ext}`;
    const storagePath = `estates/${id}/building-types/${typeId}/${filename}`;
    await this.storage.store(storagePath, file.buffer);

    const url = `/uploads/estates/${id}/building-types/${typeId}/${filename}`;
    return { url };
  }

  async deleteBuildingTypeImage(id: string, typeId: string, filename: string) {
    await this.storage
      .delete(`estates/${id}/building-types/${typeId}/${filename}`)
      .catch(() => undefined);
    return { success: true };
  }

  async hardDelete(id: string, user: AuthenticatedUser) {
    const estate = await this.findOne(id);

    const propertyCount = await this.prisma.property.count({
      where: { estateId: id, deletedAt: null },
    });
    if (propertyCount > 0) {
      throw new BadRequestException(
        `Cannot delete estate: it still has ${propertyCount} linked propert${propertyCount === 1 ? 'y' : 'ies'}. Delete all properties from this estate first.`,
      );
    }

    // Delete media files for any soft-deleted properties still linked to this estate
    const mediaRecords = await this.prisma.propertyMedia.findMany({
      where: { property: { estateId: id } },
    });
    await Promise.allSettled(
      mediaRecords.map((m) =>
        this.storage.delete(m.url.replace('/uploads/', '')),
      ),
    );

    // Delete soft-deleted properties first, then the estate (phases/blocks/infra cascade)
    await this.prisma.$transaction([
      this.prisma.property.deleteMany({ where: { estateId: id } }),
      this.prisma.estate.delete({ where: { id } }),
    ]);

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'DELETE',
      entityType: 'ESTATE',
      entityId: id,
      entityLabel: estate.name,
      newValues: { permanent: true },
    });

    return { success: true };
  }
}
