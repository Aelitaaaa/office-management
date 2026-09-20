import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsEmail(
    {},
    {
      message:
        'Email harus menggunakan format email yang valid',
    },
  )
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}