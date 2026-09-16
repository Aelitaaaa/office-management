import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  nomorPolisi: string;

  @IsString()
  @IsNotEmpty()
  jenis: string;

  @IsOptional()
  @IsString()
  merek?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  warna?: string;

  @IsOptional()
  @IsInt()
  tahun?: number;

  @IsOptional()
  @IsBoolean()
  aktif?: boolean;
}