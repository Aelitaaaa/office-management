import { Module } from '@nestjs/common';

import { ActivityLogModule } from '../activity-log/activity-log.module';

import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    ActivityLogModule,
  ],
  controllers: [
    ProductsController,
  ],
  providers: [
    ProductsService,
  ],
})
export class ProductsModule {}