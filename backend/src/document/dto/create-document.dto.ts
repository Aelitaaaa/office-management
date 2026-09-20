import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DocumentStatus } from '../../../generated/prisma/client';

export class CreateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nomorDokumen?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nama: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  kategori: string;

  @IsOptional()
  @IsDateString()
  tanggal?: string;

  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  keterangan?: string;
}