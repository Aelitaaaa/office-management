import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma/client';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}