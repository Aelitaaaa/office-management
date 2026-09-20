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

import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('suppliers')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.suppliersService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.suppliersService.findHistory();
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
    return this.suppliersService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(
    @Body()
    createSupplierDto: CreateSupplierDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.suppliersService.create(
      createSupplierDto,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body()
    updateSupplierDto: UpdateSupplierDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.suppliersService.update(
      Number(id),
      updateSupplierDto,
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
    return this.suppliersService.remove(
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
    return this.suppliersService.restore(
      Number(id),
      req.user.sub,
    );
  }
}