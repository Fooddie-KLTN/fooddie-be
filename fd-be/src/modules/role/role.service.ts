/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from 'src/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { User } from 'src/entities/user.entity';
import { Permission } from 'src/entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) { }

  /**
   * Create a new role
   *
   * @param createRoleDto The role information to be created
   * @returns The created role
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    // Find permissions by names
    const permissions = await this.permissionRepository.findBy({
      name: In(createRoleDto.permissions)
    });
    
    // Create new role
    const role = this.roleRepository.create({
      name: createRoleDto.name,
      permissions: createRoleDto.permissions, // Keep for backward compatibility
      permissionsList: permissions
    });
    
    return await this.roleRepository.save(role);
  }

  /**
   * Find all roles
   *
   * @returns An array of roles
   */
  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find({
      relations: ['permissionsList']
    });
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ 
      where: { id },
      relations: ['permissionsList']
    });
    if (!role) {
      throw new Error(`Role with id ${id} not found`);
    }
    return role;
  }

  // src/role/role.service.ts
  async addUsersToRole(roleId: string, userIds: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const users = await this.usersRepository.findByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error('One or more users not found');
    }

    role.users = users;
    return await this.roleRepository.save(role);
  }
  
  async removeUsersFromRole(roleId: string, userIds: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const users = await this.usersRepository.findByIds(userIds);
    if (users.length !== userIds.length) {
      throw new Error('One or more users not found');
    }

    role.users = role.users.filter((user) => !userIds.includes(user.id));
    return await this.roleRepository.save(role);
  }
  
  // src/role/role.service.ts
  async getUsersByRole(roleId: string): Promise<User[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['users'],
    });

    if (!role) {
      throw new Error('Role not found');
    }

    return role.users;
  }

  async getUserRoleAndPermission(userId: string): Promise<{ role: string; permissions: string[] }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissionsList'],
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    return {
      role: user.role.name,
      permissions: user.role.permissionsList.map(p => p.name), // Get permissions from the relation
    };
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(roleId: string, permissionNames: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissionsList']
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const permissions = await this.permissionRepository.findBy({
      name: In(permissionNames)
    });

    if (permissions.length !== permissionNames.length) {
      throw new Error('One or more permissions not found');
    }

    role.permissionsList = permissions;
    role.permissions = permissionNames; // Keep legacy field updated
    
    return await this.roleRepository.save(role);
  }
}