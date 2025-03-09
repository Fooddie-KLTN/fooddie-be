/* eslint-disable prettier/prettier */
// src/roles/roles.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query, Req } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';
@Controller('role')
@UseGuards(RolesGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) { }

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

  /**
 * Adds users to a role.
 *
 * @param roleId The ID of the role to which users will be added.
 * @param userIds An array of user IDs to be added to the role.
 * @returns A promise resolving with the updated role.
 *
 * Example usage:
 * POST /role/add-users
 * Body:
 * {
 *   "roleId": "role123",
 *   "userIds": ["user456", "user789"]
 * }
 * 
 * This will add users with IDs "user456" and "user789" to the role with ID "role123".
 */
  @Post('add-users')
  @Permissions(Permission.ROLE.WRITE)
  async addUsersToRole(@Body('roleId') roleId: string, @Body('userIds') userIds: string[]) {
    return await this.roleService.addUsersToRole(roleId, userIds);
  }

  @Post('remove-users')
  @Permissions(Permission.ROLE.WRITE)
  async removeUsersFromRole(@Body('roleId') roleId: string, @Body('userIds') userIds: string[]) {
    return await this.roleService.removeUsersFromRole(roleId, userIds);
  }

  @Get('users')
  @Permissions(Permission.ROLE.READ)
  async getUsersByRole(@Query('roleId') roleId: string) {
    return await this.roleService.getUsersByRole(roleId);
  }

  @Get('user-role-and-permission')
  @UseGuards(FirebaseAuthGuard)
  async getUserRoleAndPermission(@Req() req) {
    const userId = req.user.uid;
    return await this.roleService.getUserRoleAndPermission(userId);
  }

}
