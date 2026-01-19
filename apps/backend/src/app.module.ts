import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './modules/platform/auth/auth.module';
import { ConfigEngineModule } from './modules/platform/config/config.module';
import { AuditModule } from './modules/platform/audit/audit.module';
import { PrismaModule } from './modules/platform/prisma/prisma.module';
import { HealthModule } from './modules/platform/health/health.module';
import { ListingModule } from './modules/marketplace/listing/listing.module';
import { SearchModule } from './modules/marketplace/search/search.module';
import { LeadModule } from './modules/marketplace/lead/lead.module';
import { AssetModule } from './modules/ops/asset/asset.module';
import { SpaceNodeModule } from './modules/ops/space-node/space-node.module';
import { RentableItemModule } from './modules/ops/rentable-item/rentable-item.module';
import { PropertyCategoryModule } from './modules/ops/property-category/property-category.module';
import { AmenityModule } from './modules/ops/amenity/amenity.module';
import { BookingModule } from './modules/ops/booking/booking.module';
import { AgreementModule } from './modules/ops/agreement/agreement.module';
import { PricingPolicyModule } from './modules/ops/pricing-policy/pricing-policy.module';
import { PricingCalculatorModule } from './modules/finance/pricing/pricing-calculator.module';
import { InvoiceModule } from './modules/finance/invoice/invoice.module';
import { PaymentModule } from './modules/finance/payment/payment.module';
import { LedgerModule } from './modules/finance/ledger/ledger.module';
import { TicketModule } from './modules/ops/ticket/ticket.module';
import { TenantPortalModule } from './modules/tenant/tenant-portal.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PartyModule } from './modules/platform/party/party.module';
import { UsersModule } from './modules/platform/users/users.module';
import { IntegrationsModule } from './modules/platform/integrations/integrations.module';
import { RbacGuard } from './common/guards/rbac.guard';
import { DataScopeGuard } from './common/guards/data-scope.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    ConfigEngineModule,
    AuditModule,
    ListingModule,
    SearchModule,
    LeadModule,
    AssetModule,
    SpaceNodeModule,
    RentableItemModule,
    PropertyCategoryModule,
    AmenityModule,
    BookingModule,
    AgreementModule,
    PricingPolicyModule,
    PricingCalculatorModule,
    InvoiceModule,
    PaymentModule,
    LedgerModule,
    TicketModule,
    TenantPortalModule,
    NotificationsModule,
    ReportsModule,
    PartyModule,
    UsersModule,
    IntegrationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
    {
      provide: APP_GUARD,
      useClass: DataScopeGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
