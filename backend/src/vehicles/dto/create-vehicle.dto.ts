import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  nomorPolisi: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  jenis: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  merek?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  model?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  warna?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  tahun?: number;

  @IsOptional()
  @IsBoolean()
  aktif?: boolean;
}