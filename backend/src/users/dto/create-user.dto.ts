import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  username: string;

@IsEmail({}, { message: 'Email harus menggunakan format email yang valid' })
email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsIn(['ADMIN', 'STAFF', 'FINANCE', 'MANAGER'])
  role: 'ADMIN' | 'STAFF' | 'FINANCE' | 'MANAGER';
}