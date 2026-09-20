import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: {
    sub: number;
    username: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(
  AuthGuard('jwt'),
  RolesGuard,
)
@Roles('ADMIN')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('history')
  findHistory() {
    return this.usersService.findHistory();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.usersService.findOne(
      Number(id),
    );
  }

  @Post()
  create(
    @Body()
    createUserDto: CreateUserDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.usersService.create(
      createUserDto,
      req.user.sub,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    updateUserDto: UpdateUserDto,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.usersService.update(
      Number(id),
      updateUserDto,
      req.user.sub,
    );
  }

  @Patch(':id/toggle-active')
  toggleActive(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.usersService.toggleActive(
      Number(id),
      req.user.sub,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.usersService.remove(
      Number(id),
      req.user.sub,
    );
  }

  @Patch(':id/restore')
  restore(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.usersService.restore(
      Number(id),
      req.user.sub,
    );
  }

  @Delete(':id/permanent')
  permanentDelete(
    @Param('id') id: string,
    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.usersService.permanentDelete(
      Number(id),
      req.user.sub,
    );
  }
}