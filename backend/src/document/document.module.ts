import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    DocumentController,
  ],
  providers: [
    DocumentService,
  ],
})
export class DocumentModule {}