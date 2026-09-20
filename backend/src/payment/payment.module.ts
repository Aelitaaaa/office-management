import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    PaymentController,
  ],
  providers: [
    PaymentService,
  ],
})
export class PaymentModule {}