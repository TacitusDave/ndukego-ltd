import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { calculatePagination } from '@nhgp/lib';
import { AuthenticatedUser } from '@nhgp/types';
import { Prisma } from '@nhgp/database';

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(data: Prisma.CompanyCreateInput, user: AuthenticatedUser) {
    const company = await this.prisma.company.create({ data });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'COMPANY',
      entityId: company.id,
      entityLabel: company.name,
    });
    return company;
  }

  async findAll(page = 1, limit = 20) {
    const { skip } = calculatePagination(page, limit, 0);
    const where = { deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        include: { branches: { where: { deletedAt: null } } },
      }),
      this.prisma.company.count({ where }),
    ]);
    return { items, meta: calculatePagination(page, limit, total) };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, deletedAt: null },
      include: {
        branches: { where: { deletedAt: null } },
        employees: { take: 10 },
      },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(
    id: string,
    data: Prisma.CompanyUpdateInput,
    user: AuthenticatedUser,
  ) {
    await this.findOne(id);
    const company = await this.prisma.company.update({ where: { id }, data });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'COMPANY',
      entityId: id,
      entityLabel: company.name,
    });
    return company;
  }

  async createBranch(
    companyId: string,
    data: Prisma.CompanyBranchCreateInput,
    user: AuthenticatedUser,
  ) {
    await this.findOne(companyId);
    const branch = await this.prisma.companyBranch.create({
      data: { ...data, company: { connect: { id: companyId } } },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'COMPANY',
      entityId: branch.id,
      entityLabel: branch.name,
    });
    return branch;
  }

  async updateBranch(
    branchId: string,
    data: Partial<Prisma.CompanyBranchUpdateInput>,
    user: AuthenticatedUser,
  ) {
    const branch = await this.prisma.companyBranch.findFirst({
      where: { id: branchId, deletedAt: null },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    const updated = await this.prisma.companyBranch.update({
      where: { id: branchId },
      data,
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'COMPANY',
      entityId: branchId,
      entityLabel: updated.name,
    });
    return updated;
  }

  async deleteBranch(branchId: string, user: AuthenticatedUser) {
    const branch = await this.prisma.companyBranch.findFirst({
      where: { id: branchId, deletedAt: null },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    await this.prisma.companyBranch.update({
      where: { id: branchId },
      data: { deletedAt: new Date() },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'DELETE',
      entityType: 'COMPANY',
      entityId: branchId,
      entityLabel: branch.name,
    });
    return { success: true };
  }

  // ─── Departments ─────────────────────────────────────────────

  async findDepartments() {
    return this.prisma.department.findMany({
      where: { deletedAt: null },
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(
    data: { name: string; code: string; description?: string; headId?: string },
    user: AuthenticatedUser,
  ) {
    const dept = await this.prisma.department.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description ?? null,
        headId: data.headId ?? null,
      },
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
        _count: { select: { employees: true } },
      },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'COMPANY',
      entityId: dept.id,
      entityLabel: dept.name,
    });
    return dept;
  }

  async updateDepartment(
    id: string,
    data: { name?: string; description?: string; headId?: string | null },
    user: AuthenticatedUser,
  ) {
    const dept = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!dept) throw new NotFoundException('Department not found');
    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined
          ? { description: data.description }
          : {}),
        ...(data.headId !== undefined ? { headId: data.headId } : {}),
      },
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true, jobTitle: true },
        },
        _count: { select: { employees: true } },
      },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'UPDATE',
      entityType: 'COMPANY',
      entityId: id,
      entityLabel: updated.name,
    });
    return updated;
  }

  async deleteDepartment(id: string, user: AuthenticatedUser) {
    const dept = await this.prisma.department.findFirst({
      where: { id, deletedAt: null },
    });
    if (!dept) throw new NotFoundException('Department not found');
    await this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'DELETE',
      entityType: 'COMPANY',
      entityId: id,
      entityLabel: dept.name,
    });
    return { success: true };
  }
}
