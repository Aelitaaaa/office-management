import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    OrderController,
  ],
  providers: [
    OrderService,
  ],
})
export class OrderModule {}