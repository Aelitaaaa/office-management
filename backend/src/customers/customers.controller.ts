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

import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('customers')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.customersService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.customersService.findHistory();
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
    return this.customersService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(
    @Body()
    createCustomerDto: CreateCustomerDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.customersService.create(
      createCustomerDto,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body()
    updateCustomerDto: UpdateCustomerDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.customersService.update(
      Number(id),
      updateCustomerDto,
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
    return this.customersService.remove(
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
    return this.customersService.restore(
      Number(id),
      req.user.sub,
    );
  }
}