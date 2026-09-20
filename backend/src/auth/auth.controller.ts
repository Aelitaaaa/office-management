import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('login')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  })
  login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(
      username,
      password,
    );
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() request: any) {
    return request.user;
  }

  @Get('admin-test')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  adminTest(@Req() request: any) {
    return {
      message: 'Akses ADMIN berhasil',
      user: request.user,
    };
  }
}