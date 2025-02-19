/* eslint-disable prettier/prettier */
import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';
import { Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { Permission } from 'src/constants/permission.enum';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { randomUUID } from 'crypto';
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}


  @Post()
  @Permissions(Permission.USER.CREATE)
  async create(@Body() createUserDto: CreateUserDto, id: string) {
    id = randomUUID(); // Hardcoded for now
    return await this.usersService.create(createUserDto, id);
  }

  @Get()
  @Permissions(Permission.USER.READ)
  async findAll() {
    return await this.usersService.findAll();
  }  

  @Get(':id')
  @Permissions(Permission.USER.READ)
  async findOne(@Param('id') id: string) {
    return await this.usersService.findOne(id);
  }

  @Put(':id')
  @Permissions(Permission.USER.WRITE)
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions(Permission.USER.DELETE)
  async remove(@Param('id') id: string) {
    return await this.usersService.remove(id);
  }
}

