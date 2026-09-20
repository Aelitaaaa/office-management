import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    CustomersController,
  ],
  providers: [
    CustomersService,
  ],
})
export class CustomersModule {}