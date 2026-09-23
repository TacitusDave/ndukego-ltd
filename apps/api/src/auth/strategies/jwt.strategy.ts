import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '@nhgp/types';

/**
 * Errors that indicate an infrastructure hiccup (connection pool exhausted,
 * Neon cold start, transient DNS failure) rather than a genuine auth failure.
 * Treating these as 401s silently logs every active user out — the reported
 * "everything breaks until I sign out and back in" symptom.
 */
function isTransientDbError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /timed out|timeout|connection|connect|pool|unavailable|overloaded|reset|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|P1001|P1002|P1008|P2024/i.test(
    msg,
  );
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

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
    // Wrap the whole lookup so a transient DB failure degrades to
    // "trust the token claims" instead of "log the user out".
    try {
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
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;

      if (isTransientDbError(err)) {
        // Signature was already verified by passport — the token is genuine.
        // Serve the request from the JWT claims so live sessions ride through
        // the hiccup (Neon cold start, deploy, etc.).
        this.logger.warn(
          `DB unavailable during token validation — serving ${payload.email} from token claims`,
        );
        return {
          id: payload.sub,
          email: payload.email,
          type: payload.type,
          employeeId: payload.employeeId,
          customerId: payload.customerId,
          // Fresh permissions can't be resolved; the token's own claim keeps
          // the session working until the DB is reachable again.
          permissions: payload.permissions ?? [],
        };
      }

      throw err;
    }
  }

  private async getUserPermissions(
    userId: string,
    employeeId: string | null,
  ): Promise<string[]> {
    // Transient DB failures propagate to validate(), which falls back to the
    // token's declared permissions instead of killing the session.
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
