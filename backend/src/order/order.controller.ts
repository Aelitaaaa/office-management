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

import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('orders')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.orderService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.orderService.findHistory();
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
    return this.orderService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(
    @Body()
    createOrderDto: CreateOrderDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.orderService.create(
      createOrderDto,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body()
    updateOrderDto: UpdateOrderDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.orderService.update(
      Number(id),
      updateOrderDto,
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
    return this.orderService.remove(
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
    return this.orderService.restore(
      Number(id),
      req.user.sub,
    );
  }
}