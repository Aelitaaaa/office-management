import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { ProductsModule } from './products/products.module';
import { DriversModule } from './drivers/drivers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { OrderModule } from './order/order.module';
import { SuratJalanModule } from './surat-jalan/surat-jalan.module';
import { InvoiceModule } from './invoice/invoice.module';
import { PaymentModule } from './payment/payment.module';
import { PurchaseModule } from './purchase/purchase.module';
import { IncomingLetterModule } from './incoming-letter/incoming-letter.module';
import { OutgoingLetterModule } from './outgoing-letter/outgoing-letter.module';
import { DocumentModule } from './document/document.module';

import { ActivityLogModule } from './activity-log/activity-log.module';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    SuppliersModule,
    ProductsModule,
    DriversModule,
    VehiclesModule,
    OrderModule,
    SuratJalanModule,
    InvoiceModule,
    PaymentModule,
    PurchaseModule,
    IncomingLetterModule,
    OutgoingLetterModule,
    DocumentModule,

    ActivityLogModule,
    AnnouncementsModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
