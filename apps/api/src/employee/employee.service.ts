import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { calculatePagination } from '@nhgp/lib';

function generateEmployeeNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `EMP-${timestamp}-${random}`;
}

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const { skip } = calculatePagination(page, limit, 0);

    const where: Record<string, unknown> = { deletedAt: null };
    if (query.status) where.status = query.status;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeNumber: { contains: query.search, mode: 'insensitive' } },
        { jobTitle: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where: where as never,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: { select: { id: true, name: true } },
          roles: {
            include: { role: { select: { id: true, name: true, code: true } } },
          },
        },
      }),
      this.prisma.employee.count({ where: where as never }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true } },
        roles: {
          include: { role: { select: { id: true, name: true, code: true } } },
        },
        user: {
          select: { id: true, email: true, status: true, lastLoginAt: true },
        },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    jobTitle: string;
    departmentId?: string;
    hireDate?: string;
    password: string;
  }) {
    const existing = await this.prisma.employee.findFirst({
      where: { email: data.email },
    });
    if (existing)
      throw new ConflictException('An employee with this email already exists');

    const userExists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (userExists)
      throw new ConflictException(
        'A user account with this email already exists',
      );

    const company = await this.prisma.company.findFirst({
      where: { deletedAt: null },
    });
    if (!company)
      throw new NotFoundException(
        'No company record found. Please create a company first.',
      );

    const employeeNumber = generateEmployeeNumber();
    const passwordHash = await bcrypt.hash(data.password, 12);

    return this.prisma.employee.create({
      data: {
        employeeNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.jobTitle,
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
        status: 'ACTIVE',
        company: { connect: { id: company.id } },
        department: data.departmentId
          ? { connect: { id: data.departmentId } }
          : undefined,
        user: {
          create: {
            email: data.email,
            passwordHash,
            type: 'EMPLOYEE',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        department: { select: { id: true, name: true } },
        user: { select: { id: true, email: true, status: true } },
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      jobTitle?: string;
      departmentId?: string;
      status?: string;
    },
  ) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        jobTitle: data.jobTitle,
        status: data.status as never,
        department: data.departmentId
          ? { connect: { id: data.departmentId } }
          : undefined,
      },
      include: { department: { select: { id: true, name: true } } },
    });

    // Sync linked user account status when employee status changes
    if (data.status) {
      const userStatus =
        data.status === 'INACTIVE' || data.status === 'TERMINATED'
          ? 'INACTIVE'
          : 'ACTIVE';
      await this.prisma.user.updateMany({
        where: { email: employee.email },
        data: { status: userStatus as never },
      });
    }

    return updated;
  }

  async softDelete(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException('Employee not found');

    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'TERMINATED' as never },
    });

    await this.prisma.user.updateMany({
      where: { email: employee.email },
      data: { status: 'INACTIVE' as never, deletedAt: new Date() },
    });

    return { success: true };
  }

  async getDepartments() {
    return this.prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  async getRoles() {
    return this.prisma.role.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  async assignRole(employeeId: string, roleId: string) {
    const existing = await this.prisma.employeeRole.findFirst({
      where: { employeeId, roleId },
    });
    if (existing) return { success: true, message: 'Role already assigned' };
    await this.prisma.employeeRole.create({ data: { employeeId, roleId } });
    return { success: true };
  }

  async removeRole(employeeId: string, roleId: string) {
    await this.prisma.employeeRole.deleteMany({
      where: { employeeId, roleId },
    });
    return { success: true };
  }
}
