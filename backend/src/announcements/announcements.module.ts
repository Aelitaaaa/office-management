import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  imports: [
    ActivityLogModule,
  ],

  controllers: [
    AnnouncementsController,
  ],

  providers: [
    AnnouncementsService,
  ],

  exports: [
    AnnouncementsService,
  ],
})
export class AnnouncementsModule {}
