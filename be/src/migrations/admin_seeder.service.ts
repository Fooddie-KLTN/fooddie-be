/* eslint-disable prettier/prettier */
// src/admin-seed.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { Permission } from 'src/constants/permission.enum';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    // Lấy toàn bộ permission từ enum Permission
    const allPermissions: string[] = Object.values(Permission).reduce(
      (acc: string[], curr: any) => acc.concat(Object.values(curr)),
      [],
    );

    // Tạo role Admin nếu chưa tồn tại
    let adminRole = await this.roleRepository.findOne({ where: { name: 'Admin' } });
    if (!adminRole) {
      adminRole = this.roleRepository.create({
        name: 'Admin',
        permissions: allPermissions,
      });
      adminRole = await this.roleRepository.save(adminRole);
      this.logger.log('Admin role created.');
    } else {
      this.logger.log('Admin role already exists.');
      adminRole.permissions = allPermissions;
      adminRole = await this.roleRepository.save(adminRole);
    }

    let userRole = await this.roleRepository.findOne({ where: { name: 'User' } });
    if (!userRole) {
      userRole = this.roleRepository.create({
        name: 'User',
        permissions: [],
      });
      userRole = await this.roleRepository.save(userRole);
      this.logger.log('User role created.');
    } else {
      this.logger.log('User role already exists.');
    }

    let storeOwnerRole = await this.roleRepository.findOne({ where: { name: 'StoreOwner' } });
    if (!storeOwnerRole) {
      storeOwnerRole = this.roleRepository.create({
        name: 'StoreOwner',
        permissions: [],
      });
      storeOwnerRole = await this.roleRepository.save(storeOwnerRole);
      this.logger.log('StoreOwner role created.');
    } else {
      this.logger.log('StoreOwner role already exists.');
    }

    let shipperRole = await this.roleRepository.findOne({ where: { name: 'Shipper' } });
    if (!shipperRole) {
      shipperRole = this.roleRepository.create({
        name: 'Shipper',
        permissions: [],
      });
      shipperRole = await this.roleRepository.save(shipperRole);
      this.logger.log('Shipper role created.');
    } else {
      this.logger.log('Shipper role already exists.');
    }
    
    // Tạo user admin nếu chưa tồn tại (theo email mặc định "admin@example.com")
    let adminUser = await this.userRepository.findOne({ where: { email: 'adminadmin@gmail.com' } });
    if (!adminUser) {
      adminUser = this.userRepository.create({
        id: 'PTlLiD896cPjfeljg6U4zSsO7Fg2', // Nếu có sẵn uid của firebase admin, có thể đặt ở đây
        username: 'admin',
        email: 'adminadmin@gmail.com',
        name: 'Administrator',
        birthday: new Date(),
        role: adminRole,
      });
      adminUser = await this.userRepository.save(adminUser);
      this.logger.log('Admin user created.');
    } else {
      this.logger.log('Admin user already exists.');
    }
  }
}
