import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { CompanyModule } from './company/company.module';
import { EstateModule } from './estate/estate.module';
import { PropertyModule } from './property/property.module';
import { CustomerModule } from './customer/customer.module';
import { ReservationModule } from './reservation/reservation.module';
import { SaleModule } from './sale/sale.module';
import { PaymentModule } from './payment/payment.module';
import { InspectionModule } from './inspection/inspection.module';
import { DocumentModule } from './document/document.module';
import { EmployeeModule } from './employee/employee.module';
import { VendorModule } from './vendor/vendor.module';
import { AppointmentModule } from './appointment/appointment.module';
import { NotificationModule } from './notification/notification.module';
import { AiModule } from './ai/ai.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EmailModule } from './email/email.module';
import { GalleryModule } from './gallery/gallery.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuditModule,
    StorageModule,
    EmailModule,
    AuthModule,
    CompanyModule,
    EstateModule,
    PropertyModule,
    CustomerModule,
    ReservationModule,
    SaleModule,
    PaymentModule,
    InspectionModule,
    DocumentModule,
    EmployeeModule,
    VendorModule,
    AppointmentModule,
    NotificationModule,
    AiModule,
    DashboardModule,
    GalleryModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
