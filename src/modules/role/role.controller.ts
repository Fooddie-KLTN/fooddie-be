/* eslint-disable prettier/prettier */
// src/roles/roles.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query, Req, UnauthorizedException, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { RolesService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission } from 'src/constants/permission.enum';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import { DefaultRole } from 'src/entities/role.entity';

@Controller('role')
@UseGuards(RolesGuard)
export class RoleController {
  constructor(private readonly roleService: RolesService) { }

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

  /**
   * Gets the authenticated user's role.
   * Intended for middleware to check if a user has administrative privileges.
   * - Returns 200 OK with role if user is ADMINISTRATOR or SUPER_ADMIN.
   * - Returns 403 Forbidden if user has other roles (e.g., USER) or no role.
   * @param req The authenticated request object.
   * @returns The user's role if authorized, otherwise throws ForbiddenException.
   */
  @Get('user-role-and-permission')
  @UseGuards(AuthGuard) // Ensures user is authenticated and req.user is populated
  // @Permissions(Permission.ROLE.READ) // Not strictly needed if AuthGuard is sufficient for identification
                                      // and the logic here is about role-based access for a specific purpose.
                                      // If any authenticated user can ask for their own role, this is fine.
                                      // The middleware uses this to gate /admin, so the check is effectively there.
  async getUserRoleAndPermission(@Req() req: Request) {
    const userFromRequest = req.user as any;

    if (!userFromRequest || !userFromRequest.id) {
      // This should ideally be caught by AuthGuard, but as a fallback:
      throw new UnauthorizedException('User not authenticated or user ID missing.');
    }
    const userId = userFromRequest.id;
    const roleStatus = await this.roleService.getUserRoleStatus(userId);

    // Check if the user is an Administrator or Super Admin
    if (roleStatus.roleName === DefaultRole.ADMINISTRATOR || roleStatus.roleName === DefaultRole.SUPER_ADMIN) {
      // User has an administrative role, return 200 OK with the role name.
      // The frontend expects the role name for its specific check against DefaultRole.ADMINISTRATOR.
      // If a SUPER_ADMIN should also pass the DefaultRole.ADMINISTRATOR check in the frontend,
      // the frontend logic might need adjustment, or the backend could return 'administrator'
      // for both if that's the desired interpretation for this specific middleware check.
      // For now, returning the actual role name.
      return { role: { name: roleStatus.roleName } }; // Conforms to VerifyRoleResponse
    } else {
      // User is a normal user, has no role, or another non-admin role.
      // They are not authorized for what the middleware is checking (admin access).
      throw new ForbiddenException('Insufficient permissions.'); // This will result in an HTTP 403
    }
  }
}
