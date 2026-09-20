import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    DriversController,
  ],
  providers: [
    DriversService,
  ],
})
export class DriversModule {}