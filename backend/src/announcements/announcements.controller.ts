import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

interface AuthenticatedRequest
  extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('announcements')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class AnnouncementsController {
  constructor(
    private readonly announcementsService: AnnouncementsService,
  ) {}

  @Get('active')
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findActive() {
    return this.announcementsService.findActive();
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.announcementsService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(
    @Param('id') id: string,
  ) {
    return this.announcementsService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles('ADMIN')
  create(
    @Body()
    dto: CreateAnnouncementDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.announcementsService.create(
      dto,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,

    @Body()
    dto: UpdateAnnouncementDto,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.announcementsService.update(
      Number(id),
      dto,
      req.user.sub,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.announcementsService.remove(
      Number(id),
      req.user.sub,
    );
  }
}
