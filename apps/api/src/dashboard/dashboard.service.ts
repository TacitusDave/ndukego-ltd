import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const results = await Promise.allSettled([
      this.prisma.property.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.estate.count({ where: { deletedAt: null } }),
      this.prisma.estate.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.customer.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.property.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          internalNumber: true,
          title: true,
          status: true,
          listingPrice: true,
          state: true,
          city: true,
          createdAt: true,
          estate: { select: { name: true } },
        },
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          actorEmail: true,
          action: true,
          entityType: true,
          entityLabel: true,
          createdAt: true,
        },
      }),
      this.prisma.reservation.count(),
      this.prisma.reservation.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.sale.count(),
      this.prisma.sale.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.$queryRawUnsafe<{ total: string; newCount: string }[]>(
        `SELECT COUNT(*)::text AS total,
                COALESCE(SUM(CASE WHEN status = 'NEW' THEN 1 ELSE 0 END), 0)::text AS "newCount"
         FROM inquiries`,
      ),
    ]);

    // Extract each result safely — a failed query becomes its default value.
    function val<T>(idx: number, fallback: T): T {
      const r = results[idx];
      return r.status === 'fulfilled' ? (r.value as T) : fallback;
    }

    const propertiesByStatus = val(
      0,
      [] as { status: string; _count: { id: number } }[],
    );
    const totalEstates = val(1, 0);
    const estatesByStatus = val(
      2,
      [] as { status: string; _count: { id: number } }[],
    );
    const totalCustomers = val(3, 0);
    const customersByStatus = val(
      4,
      [] as { status: string; _count: { id: number } }[],
    );
    const recentProperties = val(5, []);
    const recentActivity = val(6, []);
    const totalReservations = val(7, 0);
    const reservationsByStatus = val(
      8,
      [] as { status: string; _count: { id: number } }[],
    );
    const totalSales = val(9, 0);
    const salesByStatus = val(
      10,
      [] as { status: string; _count: { id: number } }[],
    );
    const inquiryCounts = val(11, [] as { total: string; newCount: string }[]);

    const propertyStatusMap = Object.fromEntries(
      propertiesByStatus.map((r) => [r.status, r._count.id]),
    );
    const estateStatusMap = Object.fromEntries(
      estatesByStatus.map((r) => [r.status, r._count.id]),
    );
    const customerStatusMap = Object.fromEntries(
      customersByStatus.map((r) => [r.status, r._count.id]),
    );
    const reservationStatusMap = Object.fromEntries(
      reservationsByStatus.map((r) => [r.status, r._count.id]),
    );
    const salesStatusMap = Object.fromEntries(
      salesByStatus.map((r) => [r.status, r._count.id]),
    );

    const totalProperties = propertiesByStatus.reduce(
      (s, r) => s + r._count.id,
      0,
    );
    const iq = inquiryCounts[0] ?? { total: '0', newCount: '0' };

    return {
      properties: { total: totalProperties, byStatus: propertyStatusMap },
      estates: { total: totalEstates, byStatus: estateStatusMap },
      customers: { total: totalCustomers, byStatus: customerStatusMap },
      reservations: {
        total: totalReservations,
        byStatus: reservationStatusMap,
      },
      sales: { total: totalSales, byStatus: salesStatusMap },
      inquiries: {
        total: parseInt(iq.total, 10),
        newCount: parseInt(iq.newCount, 10),
      },
      recentProperties,
      recentActivity,
    };
  }
}
