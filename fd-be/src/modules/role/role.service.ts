import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, DefaultRole } from '../../entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { User } from '../../entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleDetailsDto } from './dto/role-details.dto';
import { Permission as PermissionEnum, PermissionType } from 'src/constants/permission.enum';
import { UpdateRoleDto } from './dto/update-role.dto';

/**
 * Service for managing roles and their permissions
 */
@Injectable()
export class RolesService {
  /**
   * Creates a new instance of RolesService
   * 
   * @param roleRepository - The TypeORM repository for roles
   * @param permissionRepository - The TypeORM repository for permissions
   * @param userRepository - The TypeORM repository for users
   */
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  /**
   * Get all roles with their permissions and accurate user counts
   * 
   * @returns A promise that resolves to an array of roles with user count
   */
  async findAll(): Promise<(Role & { userCount: number })[]> {
    // First, get all roles
    const roles = await this.roleRepository.find({
    });

    // Create an array to hold the results
    const rolesWithUserCount: (Role & { userCount: number })[] = [];

    // For each role, get the user count from the database using QueryBuilder
    for (const role of roles) {
      const userCount = await this.userRepository.createQueryBuilder('user')
        .where('user.role_id = :roleId', { roleId: role.id })
        .getCount();

      // Add the role with user count to the results
      rolesWithUserCount.push({
        ...role,
        userCount,
      });
    }

    return rolesWithUserCount;
  }

  /**
   * Find a role by its ID
   * 
   * @param id - The ID of the role to find
   * @returns A promise that resolves to the found role
   * @throws NotFoundException if the role is not found
   */
  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${id} not found`);
    }

    return role;
  }

  /**
   * Find a role by its name
   * 
   * @param name - The name of the role to find
   * @returns A promise that resolves to the found role
   * @throws NotFoundException if the role is not found
   */
  async getRoleByName(name: DefaultRole): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role ${name} not found`);
    }

    return role;
  }

  /**
   * Get user permissions by user ID or role ID
   * 
   * @param id - The user ID or role ID
   * @param isRoleId - Whether the ID is a role ID (defaults to false)
   * @returns A promise that resolves to an array of permissions
   * @throws NotFoundException if user or role not found
   */
  async getUserPermissions(
    id: string,
    isRoleId: boolean = false,
  ): Promise<Permission[] | string[]> {
    if (isRoleId) {
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['permissions'],
      });

      if (!role) {
        throw new NotFoundException(`Role with id ${id} not found`);
      }

      return role.permissions.filter(permission => permission.isActive)
        .map(permission => permission.name);
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['role', 'role.permissions'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user.role.permissions.filter(permission => permission.isActive);
  }
  /**
   * Check if a role has a specific permission
   * 
   * @param roleId - The role ID to check
   * @param permissionName - The permission name to check for
   * @returns A promise that resolves to a boolean indicating if the role has the permission
   */
  async hasPermission(
    roleId: string,
    permissionName: string,
  ): Promise<boolean> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      return false;
    }

    return role.permissions.some(
      permission => permission.name === permissionName && permission.isActive
    );
  }

  /**
   * Create a new role
   * 
   * @param createRoleDto - The data for creating the role
   * @returns A promise that resolves to the created role
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(role);
  }

  /**
   * Add users to a role
   * 
   * @param roleId - The ID of the role to add users to
   * @param userIds - Array of user IDs to add to the role
   * @returns A promise that resolves to the updated role
   * @throws NotFoundException if role or users not found
   */
  async addUsersToRole(roleId: string, userIds: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const users = await this.userRepository.findByIds(userIds);
    if (users.length !== userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    if (users.some(user => user.role.name == DefaultRole.SUPER_ADMIN)) {
      throw new BadRequestException('Không thể chỉnh sửa vai trò này');
    }


    role.users = users;
    return await this.roleRepository.save(role);
  }
  /**
   * Assign multiple users to a role by adding them to existing users
   * 
   * @param roleId - The ID of the role to assign users to
   * @param userIds - Array of user IDs to assign to the role
   * @returns A promise that resolves to the updated role
   * @throws NotFoundException if role or users not found
   * @throws BadRequestException if attempting to modify Super Admin users
   */
  async assignUsersToRole(roleId: string, userIds: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    // Find the users to add
    const usersToAdd = await this.userRepository.findBy({ id: In(userIds) });

    if (usersToAdd.length !== userIds.length) {
      const foundIds = usersToAdd.map(user => user.id);
      const missingIds = userIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Users not found: ${missingIds.join(', ')}`);
    }

    // Prevent modifying Super Admin users
    if (usersToAdd.some(user => user.role?.name === DefaultRole.SUPER_ADMIN)) {
      throw new BadRequestException('Không thể chỉnh sửa vai trò này');
    }

    // Get existing user IDs to avoid duplicates
    const existingUserIds = (role.users || []).map(user => user.id);

    // Add only users that aren't already assigned to the role
    const filteredUsersToAdd = usersToAdd.filter(user => !existingUserIds.includes(user.id));

    // Combine existing and new users
    role.users = [...(role.users || []), ...filteredUsersToAdd];

    return await this.roleRepository.save(role);
  }
  /**
   * Remove users from a role
   * 
   * @param roleId - The ID of the role to remove users from
   * @param userIds - Array of user IDs to remove from the role
   * @returns A promise that resolves to the updated role
   * @throws NotFoundException if role not found
   * @throws BadRequestException if attempting to modify Super Admin users
   */
  async removeUsersFromRole(roleId: string, userIds: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const users = await this.userRepository.findByIds(userIds);
    if (users.length !== userIds.length) {
      throw new NotFoundException('One or more users not found');
    }

    // Prevent removing Super Admin users
    if (users.some(user => user.role?.name === DefaultRole.SUPER_ADMIN)) {
      throw new BadRequestException('Không thể chỉnh sửa vai trò này');
    }

    role.users = role.users.filter((user) => !userIds.includes(user.id));
    return await this.roleRepository.save(role);
  }

  /**
   * Get users with a specific role
   * 
   * @param roleId - The ID of the role to get users for
   * @returns A promise that resolves to an array of users with the specified role
   * @throws NotFoundException if role not found
   */
  async getUsersByRole(roleId: string): Promise<User[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role.users;
  }

  /**
   * Get users who don't have a specific role and are not Super Admins
   * 
   * @param params - Parameters for filtering users
   * @param params.roleId - The ID of the role to exclude
   * @param params.limit - Maximum number of users to return (optional)
   * @param params.searchTerm - Search term to filter by username or name (optional)
   * @returns A promise that resolves to an array of users without the specified role
   * @throws NotFoundException if role not found
   */
  async getUsersWithoutRole(params: {
    roleId: string;
    limit?: number;
    searchTerm?: string;
  }): Promise<User[]> {
    const { roleId, limit, searchTerm } = params;

    // First verify the role exists
    const role = await this.roleRepository.findOne({
      where: { id: roleId }
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    // Find the Super Admin role
    const superAdminRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.SUPER_ADMIN }
    });

    // Build the query
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoin('user.role', 'role')
      .where('role.id != :roleId', { roleId });

    // Add condition to exclude Super Admins
    if (superAdminRole) {
      queryBuilder.andWhere('role.id != :superAdminRoleId', {
        superAdminRoleId: superAdminRole.id
      });
    }

    // Add search by name condition if provided
    if (searchTerm) {
      queryBuilder.andWhere(
        '(user.name ILIKE :searchTerm OR user.username ILIKE :searchTerm OR user.email ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      );
    }

    // Apply limit if provided
    if (limit && limit > 0) {
      queryBuilder.take(limit);
    }

    // Order by name to provide consistent results
    queryBuilder.orderBy('user.name', 'ASC');

    const usersWithoutRole = await queryBuilder.getMany();
    return usersWithoutRole;
  }
  /**
   * Add permissions to a role
   * 
   * @param roleId - The ID of the role to add permissions to
   * @param permissionNames - Array of permission names to add
   * @returns A promise that resolves to the updated role
   * @throws NotFoundException if role not found
   */
  async addPermissionsToRole(roleId: string, permissionNames: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Find existing permissions by name
    const existingPermissions = await this.permissionRepository.find({
      where: { name: In(permissionNames) },
    });

    // Collect names of existing permissions
    const existingPermissionNames: string[] = existingPermissions.map(p => p.name);

    // Create any permissions that don't exist yet
    const permissionsToCreate = permissionNames.filter(
      name => !existingPermissionNames.includes(name)
    );

    const newPermissions: Permission[] = [];

    if (permissionsToCreate.length > 0) {
      for (const permissionName of permissionsToCreate) {
        const newPermission = this.permissionRepository.create({
          name: permissionName,
          description: `Permission to ${permissionName.replace(/_/g, ' ')}`,
          isActive: true,
        });
        newPermissions.push(await this.permissionRepository.save(newPermission));
      }
    }

    // Add all permissions to the role
    role.permissions = [...role.permissions, ...existingPermissions, ...newPermissions];

    // Remove duplicates if any
    role.permissions = Array.from(new Set(role.permissions.map(p => p.id)))
      .map(id => role.permissions.find(p => p.id === id)!);

    return await this.roleRepository.save(role);
  }

  /**
   * Remove permissions from a role
   * 
   * @param roleId - The ID of the role to remove permissions from
   * @param permissionNames - Array of permission names to remove
   * @returns A promise that resolves to the updated role
   * @throws NotFoundException if role not found
   */
  async removePermissionsFromRole(roleId: string, permissionNames: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.permissions = role.permissions.filter(
      permission => !permissionNames.includes(permission.name)
    );

    return await this.roleRepository.save(role);
  }

  /**
   * Update the permissions of a role
   * 
   * @param roleId - The ID of the role to update permissions for
   * @param permissionNames - Array of permission names to set for the role
   * @returns A promise that resolves to the updated role
   * @throws NotFoundException if role not found
   * @throws BadRequestException if any permission name is invalid
   */
  async updateRolePermissions(roleId: string, permissionNames: string[]): Promise<Role> {
    // Validate that all permissions exist in the enum
    const allValidPermissions = this.getAllPermissions();
    const invalidPermissions = permissionNames.filter(
      name => !allValidPermissions.includes(name as unknown as PermissionType)
    );

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }

    // Find the role and its current permissions
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    // Get existing permissions from database that match the requested names
    const existingPermissions = await this.permissionRepository.find({
      where: { name: In(permissionNames) },
    });

    // Create any permissions that don't exist yet
    const existingPermissionNames = existingPermissions.map(p => p.name);
    const permissionsToCreate = permissionNames.filter(
      name => !existingPermissionNames.includes(name)
    );

    const newPermissions: Permission[] = [];

    if (permissionsToCreate.length > 0) {
      for (const permissionName of permissionsToCreate) {
        const newPermission = this.permissionRepository.create({
          name: permissionName,
          description: `Permission to ${permissionName.replace(/_/g, ' ')}`,
          isActive: true,
        });
        newPermissions.push(await this.permissionRepository.save(newPermission));
      }
    }

    // Set the role's permissions to exactly match the provided list
    role.permissions = [...existingPermissions, ...newPermissions];

    return await this.roleRepository.save(role);
  }

  /**
   * Helper method to get all permissions as a flat array
   * @returns Array of all available permission strings
   */
  public getAllPermissions(): PermissionType[] {
    const allPermissions: PermissionType[] = [];

    // Iterate through main permission categories
    Object.keys(PermissionEnum).forEach(category => {
      const categoryPermissions = PermissionEnum[category];

      if (typeof categoryPermissions === 'string') {
        // Handle single string permissions like SETTING
        allPermissions.push(categoryPermissions as unknown as PermissionType);
      } else if (typeof categoryPermissions === 'object') {
        // Handle permission object with multiple types
        Object.values(categoryPermissions).forEach(permission => {
          if (typeof permission === 'string') {
            allPermissions.push(permission as unknown as PermissionType);
          }
        });
      }
    });

    return allPermissions;
  }

  /**
   * Get detailed role information including permissions, users, and user count
   * 
   * @param roleId - The ID of the role to get details for
   * @returns A promise that resolves to the role details DTO
   * @throws NotFoundException if role not found
   */
  async getRoleDetails(roleId: string): Promise<RoleDetailsDto> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions', 'users'],
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    // Get accurate user count using query builder
    const userCount = await this.userRepository.createQueryBuilder('user')
      .where('user.role_id = :roleId', { roleId: role.id })
      .getCount();

    // Map the role to the DTO
    const roleDetails: RoleDetailsDto = {
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions,
      userCount: userCount,
      users: role.users || [],
    };

    return roleDetails;
  }
  /**
   * Get all roles with their permissions, user count, and users
   * 
   * @returns A promise that resolves to an array of role details DTOs
   */
  async findAllWithDetails(): Promise<RoleDetailsDto[]> {
    const roles = await this.roleRepository.find({
      relations: ['permissions', 'users'],
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions,
      userCount: role.users?.length || 0,
      users: role.users || [],
    }));
  }

  /**
   * Update role details
   * 
   * @param roleId - The ID of the role to update
   * @param updateRoleDto - The data to update the role with
   * @returns A promise that resolves to the updated role
   * @throws NotFoundException if role not found
   */
  async updateRoleDetails(roleId: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    // Only update fields that are provided
    if (updateRoleDto.displayName !== undefined && updateRoleDto.displayName !== '') {
      role.displayName = updateRoleDto.displayName;
      if (role.name === DefaultRole.USER)
        role.name = DefaultRole.USER;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    return await this.roleRepository.save(role);
  }

  /**
   * Delete a role by ID
   * 
   * @param roleId - The ID of the role to delete
   * @returns A promise that resolves to the deleted role
   * @throws NotFoundException if role not found
   */
  async deleteRole(roleId: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException(`Role with id ${roleId} not found`);
    }

    return await this.roleRepository.remove(role);
  }
}