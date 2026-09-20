import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LetterType } from '../../../generated/prisma/client';

export class CreateIncomingLetterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nomorSurat: string;

  @IsDateString()
  tanggalSurat: string;

  @IsOptional()
  @IsDateString()
  tanggalTerima?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  pengirim: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  perihal: string;

  @IsOptional()
  @IsEnum(LetterType)
  jenis?: LetterType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  keterangan?: string;
}