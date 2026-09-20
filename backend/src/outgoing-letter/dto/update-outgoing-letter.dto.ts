import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LetterType } from '../../../generated/prisma/client';

export class UpdateOutgoingLetterDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nomorSurat?: string;

  @IsOptional()
  @IsDateString()
  tanggalSurat?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  penerima?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  perihal?: string;

  @IsOptional()
  @IsEnum(LetterType)
  jenis?: LetterType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  keterangan?: string;
}