import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { IncomingLetterController } from './incoming-letter.controller';
import { IncomingLetterService } from './incoming-letter.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    IncomingLetterController,
  ],
  providers: [
    IncomingLetterService,
  ],
})
export class IncomingLetterModule {}