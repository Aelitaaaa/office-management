import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PurchaseStatus } from '../../../generated/prisma/client';

export class UpdatePurchaseDto {
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}