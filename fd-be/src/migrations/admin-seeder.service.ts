/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { Permission as PermissionEnum } from 'src/constants/permission.enum';
import { Permission } from 'src/entities/permission.entity';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedAdmin();
  }

  async seedPermissions() {
    // Extract all permissions from enum
    const permissionsToCreate: { name: string; group: string }[] = [];
    
    Object.entries(PermissionEnum).forEach(([group, permissions]) => {
      Object.values(permissions).forEach(permissionName => {
        permissionsToCreate.push({
          name: permissionName,
          group: group.toLowerCase()
        });
      });
    });

    // Create permissions if they don't exist
    for (const { name, group } of permissionsToCreate) {
      let permission = await this.permissionRepository.findOne({ where: { name } });
      if (!permission) {
        permission = this.permissionRepository.create({
          name,
          group,
          description: `Permission to ${name.replace(/_/g, ' ')}`
        });
        await this.permissionRepository.save(permission);
        this.logger.log(`Created permission: ${name}`);
      }
    }
    
    this.logger.log('All permissions seeded successfully');
  }

  async seedAdmin() {
    // Get all permissions for admin role
    const allPermissions = await this.permissionRepository.find();
    
    // Create Admin role if it doesn't exist
    let adminRole = await this.roleRepository.findOne({ 
      where: { name: 'Admin' },
      relations: ['permissionsList']
    });
    
    if (!adminRole) {
      adminRole = this.roleRepository.create({
        name: 'Admin',
        permissions: allPermissions.map(p => p.name), // Keep legacy field populated
        permissionsList: allPermissions
      });
      adminRole = await this.roleRepository.save(adminRole);
      this.logger.log('Admin role created.');
    } else {
      this.logger.log('Admin role already exists, updating permissions.');
      adminRole.permissionsList = allPermissions;
      adminRole.permissions = allPermissions.map(p => p.name); // Keep legacy field updated
      adminRole = await this.roleRepository.save(adminRole);
    }

    // Create User role if it doesn't exist
    let userRole = await this.roleRepository.findOne({ 
      where: { name: 'User' },
      relations: ['permissionsList']
    });
    
    if (!userRole) {
      userRole = this.roleRepository.create({
        name: 'User',
        permissions: [],
        permissionsList: []
      });
      userRole = await this.roleRepository.save(userRole);
      this.logger.log('User role created.');
    } else {
      this.logger.log('User role already exists.');
    }

    // Create admin user if it doesn't exist
    let adminUser = await this.userRepository.findOne({ where: { email: 'adminadmin@gmail.com' } });
    if (!adminUser) {
      adminUser = this.userRepository.create({
        id: 'PTlLiD896cPjfeljg6U4zSsO7Fg2',
        username: 'admin',
        password: '',
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
