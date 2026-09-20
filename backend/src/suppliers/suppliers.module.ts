import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    SuppliersController,
  ],
  providers: [
    SuppliersService,
  ],
})
export class SuppliersModule {}