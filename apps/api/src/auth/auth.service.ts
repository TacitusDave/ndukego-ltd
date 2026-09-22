import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { JwtPayload } from '@nhgp/types';
import type { JwtSignOptions } from '@nestjs/jwt';

function generateCustomerNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CUST-${timestamp}-${random}`;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async registerCustomer(
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone: string;
    },
    ipAddress?: string,
  ) {
    const normalizedEmail = data.email.toLowerCase();

    // Check for an existing User account
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Check for an orphaned Customer record (Customer created but User creation failed
    // in a previous attempt). Clean it up so the user can re-register cleanly.
    const orphanedCustomer = await this.prisma.customer.findUnique({
      where: { email: normalizedEmail },
      include: { user: true },
    });
    if (orphanedCustomer) {
      if (orphanedCustomer.user) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      // No linked user — safe to delete the orphaned record
      try {
        await this.prisma.customer.delete({
          where: { id: orphanedCustomer.id },
        });
      } catch {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
    }

    if (data.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const customerNumber = generateCustomerNumber();

    // Wrap both creates in a transaction so Customer and User are always in sync
    const { customer, user } = await this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          customerNumber,
          type: 'INDIVIDUAL',
          status: 'ACTIVE',
          firstName: data.firstName,
          lastName: data.lastName,
          email: normalizedEmail,
          phone: data.phone,
          leadSource: 'Website Registration',
        },
      });

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          type: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: false,
          customerId: customer.id,
        },
      });

      return { customer, user };
    });

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'CREATE',
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityLabel: `${data.firstName} ${data.lastName}`,
      newValues: { source: 'Website Registration' },
      ipAddress,
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      'CUSTOMER',
      [],
      { customerId: customer.id },
      ipAddress,
    );

    // Send welcome email (non-blocking)
    this.emailService
      .sendWelcome(user.email, { firstName: data.firstName })
      .catch(() => {});

    return {
      user: {
        id: user.id,
        email: user.email,
        type: user.type,
        customerId: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
      ...tokens,
    };
  }

  async getCustomerProfile(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        customerNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        createdAt: true,
        reservations: {
          select: {
            id: true,
            reservationNumber: true,
            status: true,
            reservedAt: true,
            expiresAt: true,
            property: {
              select: {
                id: true,
                title: true,
                state: true,
                city: true,
                listingPrice: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        favorites: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                title: true,
                state: true,
                city: true,
                listingPrice: true,
                category: true,
                status: true,
                media: {
                  where: { isCover: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer profile not found');
    return customer;
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employee: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      await this.auditService.log({
        actorEmail: email,
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        metadata: { reason: 'user_not_found' },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account temporarily locked. Try again later.',
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account deactivated');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          lockedUntil:
            failedCount >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCK_DURATION_MS)
              : null,
        },
      });
      await this.auditService.log({
        actorId: user.id,
        actorEmail: email,
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const permissions = this.extractPermissions(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.type,
      permissions,
      {
        employeeId: user.employeeId ?? undefined,
        customerId: user.customerId ?? undefined,
      },
      ipAddress,
      userAgent,
    );

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'LOGIN',
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        type: user.type,
        employeeId: user.employeeId,
        customerId: user.customerId,
        permissions,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = stored.user;
    if (user.status !== 'ACTIVE' || user.deletedAt) {
      throw new UnauthorizedException('User inactive');
    }

    const permissions = await this.getPermissionsForUser(
      user.id,
      user.employeeId,
    );

    // Slide the refresh-token expiry but do NOT rotate/revoke it. Rotation
    // broke both portals: whichever client refreshed first invalidated every
    // other tab/request still holding the old token, and clients that failed
    // to persist the replacement were locked out after the first refresh.
    // A stable token with a sliding 7-day window is safe behind httpOnly
    // cookies and keeps concurrent refreshes (multiple tabs, parallel RSC
    // fetches) idempotent.
    const refreshExpiry =
      this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        expiresAt: new Date(Date.now() + this.parseExpiry(refreshExpiry)),
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.type,
      permissions,
      {
        employeeId: user.employeeId ?? undefined,
        customerId: user.customerId ?? undefined,
      },
      ipAddress,
      userAgent,
      { issueRefreshToken: false }, // reuse the existing refresh token
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: stored.token,
    };
  }

  async logout(userId: string, refreshToken?: string, ipAddress?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { revokedAt: new Date() },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.auditService.log({
      actorId: userId,
      action: 'LOGOUT',
      ipAddress,
    });

    return { success: true, message: 'Logged out successfully' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: userId,
      entityLabel: 'Password changed',
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async updateCustomerProfile(
    customerId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      city?: string;
      state?: string;
    },
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        firstName: data.firstName ?? customer.firstName,
        lastName: data.lastName ?? customer.lastName,
        phone: data.phone ?? customer.phone,
        city: data.city ?? customer.city,
        state: data.state ?? customer.state,
      },
      select: {
        id: true,
        customerNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        city: true,
        state: true,
      },
    });

    return updated;
  }

  // ─── Super Admin TOTP ──────────────────────────────────────────

  async superAdminLogin(
    email: string,
    totpCode: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employee: {
          include: {
            roles: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt || !user.employee) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE')
      throw new UnauthorizedException('Account deactivated');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account temporarily locked. Try again later.',
      );
    }

    const totpSecret = this.configService.get<string>(
      'SUPER_ADMIN_TOTP_SECRET',
    );
    if (!totpSecret)
      throw new UnauthorizedException('Super admin not configured');

    const isValid = authenticator.verify({
      token: totpCode,
      secret: totpSecret,
    });

    if (!isValid) {
      const failedCount = user.failedLoginCount + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          lockedUntil:
            failedCount >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCK_DURATION_MS)
              : null,
        },
      });
      await this.auditService.log({
        actorId: user.id,
        actorEmail: email,
        action: 'LOGIN_FAILED',
        ipAddress,
        userAgent,
        metadata: { reason: 'invalid_totp' },
      });
      throw new UnauthorizedException('Invalid authenticator code');
    }

    const permissions = this.extractPermissions(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.type,
      permissions,
      { employeeId: user.employeeId ?? undefined },
      ipAddress,
      userAgent,
    );

    await this.auditService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: 'LOGIN',
      ipAddress,
      userAgent,
      metadata: { method: 'totp' },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        type: user.type,
        employeeId: user.employeeId,
        permissions,
      },
      ...tokens,
    };
  }

  private extractPermissions(user: {
    employeeId: string | null;
    employee?: {
      roles: Array<{
        role: {
          permissions: Array<{ permission: { code: string } }>;
        };
      }>;
    } | null;
  }): string[] {
    const set = new Set<string>();
    if (user.employee?.roles) {
      for (const er of user.employee.roles) {
        for (const rp of er.role.permissions) {
          set.add(rp.permission.code);
        }
      }
    }
    return Array.from(set);
  }

  private async getPermissionsForUser(
    userId: string,
    employeeId: string | null,
  ): Promise<string[]> {
    if (!employeeId) {
      const customerRole = await this.prisma.role.findUnique({
        where: { code: 'CUSTOMER' },
        include: { permissions: { include: { permission: true } } },
      });
      return customerRole?.permissions.map((rp) => rp.permission.code) ?? [];
    }

    const employeeRoles = await this.prisma.employeeRole.findMany({
      where: { employeeId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });

    const set = new Set<string>();
    for (const er of employeeRoles) {
      for (const rp of er.role.permissions) {
        set.add(rp.permission.code);
      }
    }
    return Array.from(set);
  }

  private async generateTokens(
    userId: string,
    email: string,
    type: string,
    permissions: string[],
    ids: { employeeId?: string; customerId?: string },
    ipAddress?: string,
    userAgent?: string,
    options?: { issueRefreshToken?: boolean },
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      type: type as JwtPayload['type'],
      permissions,
      ...ids,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRY') ||
        '15m') as JwtSignOptions['expiresIn'], // jwt expects ms-literal | number
    });

    const issueRefreshToken = options?.issueRefreshToken !== false;
    const refreshExpiry: string =
      this.configService.get<string>('JWT_REFRESH_EXPIRY') || '7d';

    let refreshTokenValue: string | undefined;
    if (issueRefreshToken) {
      refreshTokenValue = randomBytes(64).toString('hex');
      const expiresAt = new Date(Date.now() + this.parseExpiry(refreshExpiry));

      await this.prisma.refreshToken.create({
        data: {
          token: refreshTokenValue,
          userId,
          expiresAt,
          ipAddress,
          userAgent,
        },
      });
    }

    return {
      accessToken,
      refreshToken: refreshTokenValue as string,
      expiresIn: refreshExpiry,
    };
  }

  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] ?? multipliers.d);
  }
}
