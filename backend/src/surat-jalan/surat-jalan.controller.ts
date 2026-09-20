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

import { CreateSuratJalanDto } from './dto/create-surat-jalan.dto';
import { UpdateSuratJalanDto } from './dto/update-surat-jalan.dto';
import { SuratJalanService } from './surat-jalan.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('surat-jalan')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class SuratJalanController {
  constructor(
    private readonly suratJalanService: SuratJalanService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.suratJalanService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.suratJalanService.findHistory();
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
    return this.suratJalanService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(
    @Body()
    createSuratJalanDto: CreateSuratJalanDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.suratJalanService.create(
      createSuratJalanDto,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body()
    updateSuratJalanDto: UpdateSuratJalanDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.suratJalanService.update(
      Number(id),
      updateSuratJalanDto,
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
    return this.suratJalanService.remove(
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
    return this.suratJalanService.restore(
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
    return this.suratJalanService.permanentDelete(
      Number(id),
      req.user.sub,
    );
  }
}