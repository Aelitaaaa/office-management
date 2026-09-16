import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

@Post()
@Roles('ADMIN')
create(@Body() createUserDto: CreateUserDto) {
  return this.usersService.create(
    createUserDto.name,
    createUserDto.username,
    createUserDto.email,
    createUserDto.password,
    createUserDto.role,
  );
}
 @Patch(':id')
@Roles('ADMIN')
update(
  @Param('id') id: string,
  @Body() updateUserDto: UpdateUserDto,
) {
  return this.usersService.update(Number(id), updateUserDto);
}

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }
}