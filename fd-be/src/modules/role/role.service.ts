/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { User } from 'src/entities/user.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  /**
   * Create a new role
   *
   * @param createRoleDto The role information to be created
   * @returns The created role
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepository.create(createRoleDto);
    return await this.roleRepository.save(role);
  }

  /**
   * Find all roles
   *
   * @returns An array of roles
   */
  async findAll(): Promise<Role[]> {
    return await this.roleRepository.find();
  }

  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
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
      relations: ['role'],
    });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    return {
      role: user.role.name, // Return role name as a string instead of the full Role object
      permissions: user.role.permissions, // List of permissions as a string array
    };
  }


}