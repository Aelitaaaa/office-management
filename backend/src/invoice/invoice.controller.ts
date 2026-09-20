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

import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('invoices')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
  ) {}

  @Get()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
    'MANAGER',
  )
  findAll() {
    return this.invoiceService.findAll();
  }

  @Get('history')
  @Roles('ADMIN')
  findHistory() {
    return this.invoiceService.findHistory();
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
    return this.invoiceService.findOne(
      Number(id),
    );
  }

  @Post()
  @Roles(
    'ADMIN',
    'STAFF',
    'FINANCE',
  )
  create(
    @Body()
    createInvoiceDto: CreateInvoiceDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.invoiceService.create(
      createInvoiceDto,
      req.user.sub,
    );
  }

  @Patch(':id')
  @Roles(
    'ADMIN',
    'FINANCE',
  )
  update(
    @Param('id') id: string,
    @Body()
    updateInvoiceDto: UpdateInvoiceDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.invoiceService.update(
      Number(id),
      updateInvoiceDto,
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
    return this.invoiceService.remove(
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
    return this.invoiceService.restore(
      Number(id),
      req.user.sub,
    );
  }
}