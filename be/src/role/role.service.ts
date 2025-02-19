/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

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

  /**
   * Find a role by id
   *
   * @param id The role id
   * @returns The role with the given id
   */



  

}