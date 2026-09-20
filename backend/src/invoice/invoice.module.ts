import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    InvoiceController,
  ],
  providers: [
    InvoiceService,
  ],
})
export class InvoiceModule {}