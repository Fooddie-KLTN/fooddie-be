/* eslint-disable prettier/prettier */
// src/roles/roles.controller.ts
import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
@Controller('role')
@UseGuards( RolesGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @Permissions(Permission.ROLE.CREATE)  // Chỉ cho phép những user có permission 'create_role'
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.roleService.createRole(createRoleDto);
  }

  @Get()
  @Permissions(Permission.ROLE.READ)  // Ví dụ: xem danh sách role
  async findAll() {
    return await this.roleService.findAll();
  }

  // @Get(':id')
  // @Permissions(Permission.ROLE.READ)  // Ví dụ: xem thông tin role
  // async findOne(@Body() id: string) {
  //   return await this.roleService.findOne(id);
  // }

  // @Post(':id')
  // @Permissions(Permission.ROLE.CREATE)  // Chỉ cho phép những user có permission 'update_role'
  // async update(@Body() id: string, @Body() updateRoleDto: CreateRoleDto) {
  //   return await this.roleService.update(id, updateRoleDto);
  // }

  // @Post(':id')
  // @Permissions(Permission.ROLE.DELETE)  // Chỉ cho phép những user có permission 'delete_role'
  // async delete(@Body() id: string) {
  //   return await this.roleService.remove(id);
  // } 
}
