/* eslint-disable prettier/prettier */
// src/roles/roles.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query, Req, UnauthorizedException, ForbiddenException, HttpCode, HttpStatus, Delete, Param, Put } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorator/permissions.decorator';
import { Permission, PermissionType } from 'src/constants/permission.enum';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import { DefaultRole, Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { RoleDetailsDto } from './dto/role-details.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './role.service';
import { Permission as PermissionEntity } from '../../entities/permission.entity';

@Controller('role')

export class RoleController {
  constructor(private readonly roleService: RolesService) { }

  @Post()
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.CREATE)  // Chỉ cho phép những user có permission 'create_role'
  async create(@Body() createRoleDto: CreateRoleDto) {
    return await this.roleService.createRole(createRoleDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ)  // Ví dụ: xem danh sách role
  async findAll() {
    return await this.roleService.findAll();
  }


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

  @Get('permissions')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ)
  async getAllPermissions(): Promise<PermissionType[]> {
    return this.roleService.getAllPermissions();
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


  /**
   * Get role by ID
   * 
   * @param id - Role ID to find
   * @returns The requested role
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ)
  async findById(@Param('id') id: string): Promise<RoleDetailsDto> {
    return this.roleService.getRoleDetails(id);
  }
  /**
   * Update permissions for a role
   * 
   * @param roleId - Role ID to update permissions for
   * @param permissions - Array of permission names to set
   * @returns The updated role with new permissions
   */
  @Put(':id/permissions')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.WRITE)
  async updateRolePermissions(
    @Param('id') roleId: string,
    @Body('permissions') permissionNames: string[],
  ): Promise<Role> {
    return this.roleService.updateRolePermissions(roleId, permissionNames);
  }
  /**
* Update role details
* 
* @param roleId - Role ID to update
* @param updateRoleDto - The data to update the role with
* @returns The updated role
*/
  @Put(':id')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.WRITE)
  async updateRoleDetails(
    @Param('id') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.updateRoleDetails(roleId, updateRoleDto);
  }
  /**
   * Get users who don't have a specific role
   * 
   * @param roleId - Role ID to exclude
   * @param limit - Maximum number of users to return (optional)
   * @param search - Search term to filter by name, username or email (optional)
   * @returns List of users without the specified role
   */
  @Get(':id/users/available')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ, Permission.USER.READ)
  async getUsersWithoutRole(
    @Param('id') roleId: string,
    @Query('limit') limit?: number,
    @Query('search') search?: string
  ): Promise<User[]> {
    return this.roleService.getUsersWithoutRole({
      roleId,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      searchTerm: search
    });
  }
  /**
 * Get permissions for a specific role
 * 
 * @param roleId - Role ID to get permissions for
 * @returns List of role's permissions
 */
  @Get(':id/permissions')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ)
  async getRolePermissions(@Param('id') roleId: string): Promise<PermissionEntity[] | string[]> {
    return this.roleService.getUserPermissions(roleId, true);
  }

  /**
   * Add users to a role
   * 
   * @param roleId - Role ID to add users to
   * @param userIds - Array of user IDs to add
   * @returns The updated role
   */
  @Post(':id/users')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.WRITE)
  async addUsersToRole(
    @Param('id') roleId: string,
    @Body('userIds') userIds: string[],
  ): Promise<Role> {
    return this.roleService.addUsersToRole(roleId, userIds);
  }
  /**
   * Assign multiple users to a role
   * 
   * @param roleId - Role ID to assign users to
   * @param userIds - Array of user IDs to assign to the role
   * @returns The updated role with assigned users
   */
  @Post(':id/assign-users')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.WRITE, Permission.ROLE.WRITE)
  async assignUsersToRole(
    @Param('id') roleId: string,
    @Body('userIds') userIds: string[],
  ): Promise<Role> {
    return this.roleService.assignUsersToRole(roleId, userIds);
  }
  /**
   * Remove users from a role
   * 
   * @param roleId - Role ID to remove users from
   * @param userIds - Array of user IDs to remove
   * @returns The updated role
   */
  @Post(':id/users/remove')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.WRITE)
  async removeUsersFromRole(
    @Param('id') roleId: string,
    @Body('userIds') userIds: string[],
  ): Promise<Role> {
    return this.roleService.removeUsersFromRole(roleId, userIds);
  }

  /**
   * Get all users with a specific role
   * 
   * @param roleId - Role ID to get users for
   * @returns List of users with the role
   */
  @Get(':id/users')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ, Permission.USER.READ)
  async getUsersByRole(@Param('id') roleId: string): Promise<User[]> {
    return this.roleService.getUsersByRole(roleId);
  }

  /**
   * Get permissions for a specific user
   * 
   * @param userId - User ID to get permissions for
   * @returns List of user's permissions
   */
  @Get('user/:userId/permissions')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ, Permission.USER.READ)
  async getUserRoleAndPermissionForSpecifictUser(@Param('userId') userId: string): Promise<PermissionEntity[] | string[]> {
    return this.roleService.getUserPermissions(userId);
  }

  /**
   * Check if a role has a specific permission
   * 
   * @param roleId - Role ID to check
   * @param permissionName - Permission name to check
   * @returns Boolean indicating if the role has the permission
   */
  @Get('check-permission/:roleId/:permissionName')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.READ)
  async hasPermission(
    @Param('roleId') roleId: string,
    @Param('permissionName') permissionName: string,
  ): Promise<boolean> {
    return this.roleService.hasPermission(roleId, permissionName);
  }

  /**
   * Add permissions to a role
   * 
   * @param roleId - Role ID to add permissions to
   * @param permissionNames - Array of permission names to add
   * @returns The updated role with new permissions
   */
  @Post(':id/permissions')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.WRITE)
  async addPermissionsToRole(
    @Param('id') roleId: string,
    @Body('permissions') permissionNames: string[],
  ): Promise<Role> {
    return this.roleService.addPermissionsToRole(roleId, permissionNames);
  }

  /**
   * Remove permissions from a role
   * 
   * @param roleId - Role ID to remove permissions from
   * @param permissionNames - Array of permission names to remove
   * @returns The updated role without the removed permissions
   */
  @Post(':id/permissions/remove')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.WRITE)
  async removePermissionsFromRole(
    @Param('id') roleId: string,
    @Body('permissions') permissionNames: string[],
  ): Promise<Role> {
    return this.roleService.removePermissionsFromRole(roleId, permissionNames);
  }


  /**
   * Delete a role by ID
   * 
   * @param id - Role ID to delete
   * @return Success message
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Permissions(Permission.ROLE.DELETE)
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.roleService.deleteRole(id);
    return { message: 'Role deleted successfully' };
  }

}
