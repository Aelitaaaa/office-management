import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { OutgoingLetterController } from './outgoing-letter.controller';
import { OutgoingLetterService } from './outgoing-letter.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    OutgoingLetterController,
  ],
  providers: [
    OutgoingLetterService,
  ],
})
export class OutgoingLetterModule {}