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

import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseService } from './purchase.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('purchases')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class PurchaseController {
  constructor(
    private readonly purchaseService: PurchaseService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.purchaseService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.purchaseService.findHistory();
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
    return this.purchaseService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles('ADMIN', 'STAFF')
  create(
    @Body()
    createPurchaseDto: CreatePurchaseDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.purchaseService.create(
      createPurchaseDto,
      req.user.sub,
    );
  }

  @Patch(':id/order')
  @Roles('ADMIN', 'STAFF')
  order(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.purchaseService.order(
      Number(id),
      req.user.sub,
    );
  }

  @Patch(':id/receive')
  @Roles('ADMIN', 'STAFF')
  receive(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.purchaseService.receive(
      Number(id),
      req.user.sub,
    );
  }

  @Patch(':id/complete')
  @Roles('ADMIN', 'STAFF')
  complete(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.purchaseService.complete(
      Number(id),
      req.user.sub,
    );
  }

  @Patch(':id/cancel')
  @Roles('ADMIN', 'STAFF')
  cancel(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.purchaseService.cancel(
      Number(id),
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  update(
    @Param('id') id: string,
    @Body()
    updatePurchaseDto: UpdatePurchaseDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.purchaseService.update(
      Number(id),
      updatePurchaseDto,
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
    return this.purchaseService.remove(
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
    return this.purchaseService.restore(
      Number(id),
      req.user.sub,
    );
  }
}