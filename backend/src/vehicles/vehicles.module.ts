import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    VehiclesController,
  ],
  providers: [
    VehiclesService,
  ],
})
export class VehiclesModule {}