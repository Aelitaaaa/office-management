import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
@IsEmail({}, { message: 'Email harus menggunakan format email yang valid' })
email?: string;
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsIn(['ADMIN', 'STAFF', 'FINANCE', 'MANAGER'])
  role?: 'ADMIN' | 'STAFF' | 'FINANCE' | 'MANAGER';
}