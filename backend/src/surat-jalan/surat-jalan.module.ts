import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { SuratJalanController } from './surat-jalan.controller';
import { SuratJalanService } from './surat-jalan.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    SuratJalanController,
  ],
  providers: [
    SuratJalanService,
  ],
})
export class SuratJalanModule {}