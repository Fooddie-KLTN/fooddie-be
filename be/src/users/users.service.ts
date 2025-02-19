/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import {  Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';
import { Role } from 'src/entities/role.entity';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(createUserDto: CreateUserDto, id: string): Promise<User> {
    const role = await this.rolesRepository.findOne({ 
      where: { id: createUserDto.role } 
    });
    
    if (!role) {
      throw new Error('Role not found');
    }

    const user = this.usersRepository.create({

      ...createUserDto,
      id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      password: await bcrypt.hash(createUserDto.password, 10),
      role: role,
    });

    return this.usersRepository.save(user);
  }
  async register(createUserDto: CreateUserDto, id: string): Promise<User> {
    const role = await this.rolesRepository.findOne({ 
      where: { name: 'User' } 
    });
    
    if (!role) {
      throw new Error('Default User role not found');
    }
    if (!id){
      throw new Error('id not found');
    }
    const user = this.usersRepository.create({
      ...createUserDto,
      id: id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      password: await bcrypt.hash(createUserDto.password, 10),
      role: role,
    });

    return this.usersRepository.save(user);
  }
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    // Create update object without role
    const { role: roleId, ...updateData } = updateUserDto;

    // Handle role update if provided
    if (roleId) {
      const role = await this.rolesRepository.findOne({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: { id: roleId }
      });
      if (!role) {
        throw new Error('Role not found');
      }
      user.role = role;
    }

    // Handle password hashing if provided
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    // Update user with merged data
    Object.assign(user, updateData);
    
    return this.usersRepository.save(user);
}

  async updatePassword(id: string, password: string): Promise<User> {
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(password, 10);
    return this.usersRepository.save(user);
  }
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
// async createMany(users: User[]) {
//     const queryRunner = this.dataSource.createQueryRunner();
  
//     await queryRunner.connect();
//     await queryRunner.startTransaction();
//     try {
//       await queryRunner.manager.save(users[0]);
//       await queryRunner.manager.save(users[1]);
  
//       await queryRunner.commitTransaction();
//     } catch (err) {
//       // since we have errors lets rollback the changes we made
//       await queryRunner.rollbackTransaction();
//     } finally {
//       // you need to release a queryRunner which was manually instantiated
//       await queryRunner.release();
//     }
//   }
  
}
