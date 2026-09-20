import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsInt()
  @Min(1)
  orderId: number;

  @IsOptional()
  @IsDateString()
  jatuhTempo?: string;


   
  @IsOptional()
  @IsNumber()
  @Min(0)
  diskon?: number;

  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  pajak?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  keterangan?: string;
}