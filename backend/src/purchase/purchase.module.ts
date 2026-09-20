import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    PurchaseController,
  ],
  providers: [
    PurchaseService,
  ],
})
export class PurchaseModule {}