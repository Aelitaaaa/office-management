import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentService } from './payment.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('payments')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.paymentService.findAll();
  }

  @Get(':id')
  @Roles(
    'ADMIN',
    'FINANCE',
    'MANAGER',
  )
  findOne(
    @Param('id') id: string,
  ) {
    return this.paymentService.findOne(
      Number(id),
    );
  }

  @Post('manual')
  @Roles(
    'ADMIN',
    'FINANCE',
  )
  createManual(
    @Body()
    createPaymentDto: CreatePaymentDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.paymentService.createManual(
      createPaymentDto,
      req.user.sub,
    );
  }
}