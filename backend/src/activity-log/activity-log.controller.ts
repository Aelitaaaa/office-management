import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActivityLogService } from './activity-log.service';

@Controller('activity-logs')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class ActivityLogController {
  constructor(
    private readonly activityLogService: ActivityLogService,
  ) {}

  @Get('latest')
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findLatest(
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Number(limit);

    return this.activityLogService.findLatest(
      Number.isFinite(parsedLimit)
        ? parsedLimit
        : 5,
    );
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.activityLogService.findAll();
  }
}
