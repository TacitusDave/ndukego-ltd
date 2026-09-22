import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '@nhgp/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ||
        'development-secret-change-me',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, status: 'ACTIVE' },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const permissions = await this.getUserPermissions(user.id, user.employeeId);

    return {
      id: user.id,
      email: user.email,
      type: user.type as AuthenticatedUser['type'],
      employeeId: user.employeeId ?? undefined,
      customerId: user.customerId ?? undefined,
      permissions,
    };
  }

  private async getUserPermissions(
    userId: string,
    employeeId: string | null,
  ): Promise<string[]> {
    if (!employeeId) {
      if (
        await this.prisma.user.findFirst({
          where: { id: userId, customerId: { not: null } },
        })
      ) {
        const customerRole = await this.prisma.role.findUnique({
          where: { code: 'CUSTOMER' },
          include: { permissions: { include: { permission: true } } },
        });
        return customerRole?.permissions.map((rp) => rp.permission.code) ?? [];
      }
      return [];
    }

    const employeeRoles = await this.prisma.employeeRole.findMany({
      where: { employeeId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });

    const permissionSet = new Set<string>();
    for (const er of employeeRoles) {
      for (const rp of er.role.permissions) {
        permissionSet.add(rp.permission.code);
      }
    }
    return Array.from(permissionSet);
  }
}
