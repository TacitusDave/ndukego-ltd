import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { generateReference, calculatePagination } from '@nhgp/lib';
import {
  DocumentCategory,
  DocumentType,
  DocumentStatus,
  EntityType,
  SecurityClassification,
  Prisma,
} from '@nhgp/database';

export interface UploadDocumentDto {
  title: string;
  category: DocumentCategory;
  documentType: DocumentType;
  entityType: EntityType;
  entityId: string;
  referenceNumber?: string;
  securityClassification?: SecurityClassification;
  department?: string;
  tags?: string[];
  expirationDate?: Date;
  retentionPeriodDays?: number;
  downloadRestricted?: boolean;
  watermarkEnabled?: boolean;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

@Injectable()
export class DocumentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async upload(
    dto: UploadDocumentDto,
    file: Express.Multer.File,
    uploadedById: string,
    actorEmail: string,
  ) {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds 20 MB limit');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    const documentNumber = generateReference('DOC');
    const ext = (file.originalname.split('.').pop() ?? 'bin').toLowerCase();
    const storagePath = `${dto.entityType.toLowerCase()}/${dto.entityId}/${documentNumber}.${ext}`;

    const stored = await this.storageService.store(storagePath, file.buffer);

    const document = await this.prisma.document.create({
      data: {
        documentNumber,
        title: dto.title,
        category: dto.category,
        documentType: dto.documentType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        referenceNumber: dto.referenceNumber,
        securityClassification: dto.securityClassification ?? 'INTERNAL',
        department: dto.department,
        tags: dto.tags ?? [],
        expirationDate: dto.expirationDate,
        retentionPeriodDays: dto.retentionPeriodDays,
        downloadRestricted: dto.downloadRestricted ?? false,
        watermarkEnabled: dto.watermarkEnabled ?? false,
        originalFilename: file.originalname,
        fileExtension: ext,
        fileSize: BigInt(stored.fileSize),
        mimeType: file.mimetype,
        storagePath: stored.storagePath,
        checksum: stored.checksum,
        uploadedById,
        status: 'UPLOADED',
        versions: {
          create: {
            versionNumber: 1,
            originalFilename: file.originalname,
            fileSize: BigInt(stored.fileSize),
            mimeType: file.mimetype,
            storagePath: stored.storagePath,
            checksum: stored.checksum,
            uploadedById,
          },
        },
      },
    });

    await this.auditService.log({
      actorId: uploadedById,
      actorEmail,
      action: 'CREATE',
      entityType: 'DOCUMENT',
      entityId: document.id,
      entityLabel: document.title,
      newValues: {
        documentNumber,
        category: dto.category,
        documentType: dto.documentType,
        status: 'UPLOADED',
      },
    });

    return { ...document, fileSize: Number(document.fileSize) };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25)));
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                documentNumber: { contains: query.search, mode: 'insensitive' },
              },
              {
                referenceNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(query.category
        ? { category: query.category as DocumentCategory }
        : {}),
      ...(query.status ? { status: query.status as DocumentStatus } : {}),
      ...(query.entityType
        ? { entityType: query.entityType as EntityType }
        : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentNumber: true,
          title: true,
          category: true,
          documentType: true,
          entityType: true,
          entityId: true,
          referenceNumber: true,
          status: true,
          securityClassification: true,
          fileSize: true,
          mimeType: true,
          fileExtension: true,
          expirationDate: true,
          uploadDate: true,
          createdAt: true,
          uploadedById: true,
          tags: true,
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    const { totalPages } = calculatePagination(page, limit, total);

    return {
      items: items.map((d) => ({ ...d, fileSize: Number(d.fileSize) })),
      meta: { page, limit, total, totalPages },
    };
  }

  async findOne(id: string, actorId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: { orderBy: { versionNumber: 'desc' } },
        accessLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!document) throw new NotFoundException('Document not found');

    await this.prisma.documentAccessLog.create({
      data: { documentId: id, userId: actorId, action: 'VIEW' },
    });

    return {
      ...document,
      fileSize: Number(document.fileSize),
      versions: document.versions.map((v) => ({
        ...v,
        fileSize: Number(v.fileSize),
      })),
    };
  }

  async download(id: string, actorId: string, actorEmail: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
    });

    if (!document) throw new NotFoundException('Document not found');

    const buffer = await this.storageService.read(document.storagePath);

    await this.prisma.documentAccessLog.create({
      data: { documentId: id, userId: actorId, action: 'DOWNLOAD' },
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'DOWNLOAD',
      entityType: 'DOCUMENT',
      entityId: id,
      entityLabel: document.title,
    });

    return {
      buffer,
      mimeType: document.mimeType,
      filename: document.originalFilename,
    };
  }

  async updateStatus(
    id: string,
    status: DocumentStatus,
    actorId: string,
    actorEmail: string,
  ) {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
    });
    if (!document) throw new NotFoundException('Document not found');

    const now = new Date();
    const updateData: Prisma.DocumentUpdateInput = { status };
    if (status === 'VERIFIED') updateData.verificationDate = now;
    if (status === 'APPROVED') {
      updateData.approvalDate = now;
      updateData.approvedById = actorId;
    }
    if (status === 'ARCHIVED') updateData.archiveDate = now;

    const updated = await this.prisma.document.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'STATUS_CHANGE',
      entityType: 'DOCUMENT',
      entityId: id,
      entityLabel: document.title,
      oldValues: { status: document.status },
      newValues: { status },
    });

    return { ...updated, fileSize: Number(updated.fileSize) };
  }

  async remove(id: string, actorId: string, actorEmail: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
    });
    if (!document) throw new NotFoundException('Document not found');

    await this.prisma.document.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });

    await this.auditService.log({
      actorId,
      actorEmail,
      action: 'DELETE',
      entityType: 'DOCUMENT',
      entityId: id,
      entityLabel: document.title,
    });

    return { success: true };
  }
}
