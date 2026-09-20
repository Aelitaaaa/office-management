import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSuratJalanDto {
  @IsInt()
  @Min(1)
  orderId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  driverId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  vehicleId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referensiPO?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tujuan?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  alamat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  penerima?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  catatan?: string;
}