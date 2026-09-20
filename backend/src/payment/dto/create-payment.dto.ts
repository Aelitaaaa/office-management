import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma/client';

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  invoiceId: number;

  @IsNumber()
  @Min(0.01)
  jumlah: number;

  @IsEnum(PaymentMethod)
  metode: PaymentMethod;

  @IsOptional()
  @IsString()
  keterangan?: string;
}