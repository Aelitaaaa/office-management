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

import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('drivers')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.driversService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.driversService.findHistory();
  }

  @Get(':id')
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findOne(
    @Param('id') id: string,
  ) {
    return this.driversService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(
    @Body()
    createDriverDto: CreateDriverDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.driversService.create(
      createDriverDto,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body()
    updateDriverDto: UpdateDriverDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.driversService.update(
      Number(id),
      updateDriverDto,
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
    return this.driversService.remove(
      Number(id),
      req.user.sub,
    );
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  restore(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.driversService.restore(
      Number(id),
      req.user.sub,
    );
  }

  @Delete(':id/permanent')
  @Roles('ADMIN')
  permanentDelete(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.driversService.permanentDelete(
      Number(id),
      req.user.sub,
    );
  }
}