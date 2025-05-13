/* eslint-disable prettier/prettier */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, DefaultRole } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { Permission as PermissionEnum } from 'src/constants/permission.enum';
import { Permission } from 'src/entities/permission.entity';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { Address } from 'src/entities/address.entity';

// Use the same enum from user entity
enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

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
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
  ) { }

  async onModuleInit() {
    await this.seedPermissions();
    await this.seedRoles();
    await this.seedAdmin();
  }

  async seedPermissions() {
    // Create standard permission groups if they don't exist
    const standardGroups = [
      'user', 'role', 'permission', 'restaurant', 'food',
      'order', 'promotion', 'category', 'payment', 'review'
    ];

    // Track created permissions for reporting
    const createdPermissions: string[] = [];

    // Create CRUD permissions for each resource
    for (const group of standardGroups) {
      const operations = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'];

      for (const operation of operations) {
        const name = `${group.toUpperCase()}_${operation}`;
        const description = `Permission to ${operation.toLowerCase()} ${group}`;

        // Check if permission already exists
        let permission = await this.permissionRepository.findOne({ where: { name } });

        if (!permission) {
          permission = this.permissionRepository.create({
            name,
            description,
            isActive: true
            // Removed group property as it doesn't exist in the Permission entity
          });
          await this.permissionRepository.save(permission);
          createdPermissions.push(name);
        }
      }
    }

    // Also add special permissions from enum
    if (PermissionEnum) {
      Object.entries(PermissionEnum).forEach(async ([group, permissions]) => {
        Object.values(permissions).forEach(async (permissionName) => {
          // Check if permission already exists
          let permission = await this.permissionRepository.findOne({ where: { name: permissionName } });

          if (!permission) {
            permission = this.permissionRepository.create({
              name: permissionName,
              description: `Permission to ${permissionName.replace(/_/g, ' ').toLowerCase()}`,
              isActive: true
              // Removed group property as it doesn't exist in the Permission entity
            });
            await this.permissionRepository.save(permission);
            createdPermissions.push(permissionName);
          }
        });
      });
    }

    if (createdPermissions.length > 0) {
      this.logger.log(`Created ${createdPermissions.length} new permissions: ${createdPermissions.join(', ')}`);
    } else {
      this.logger.log('No new permissions needed to be created');
    }

    this.logger.log('Permission seeding completed successfully');
  }

  async seedRoles() {
    // Create SUPER_ADMIN role
    let superAdminRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.SUPER_ADMIN }
    });

    // Get all permissions
    const allPermissions = await this.permissionRepository.find();

    if (!superAdminRole) {
      superAdminRole = this.roleRepository.create({
        name: DefaultRole.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full system access with all permissions',
        isSystem: true,
        permissions: allPermissions
      });
      await this.roleRepository.save(superAdminRole);
      this.logger.log('Super Admin role created with all permissions.');
    } else {
      // Update permissions for existing role
      superAdminRole.permissions = allPermissions;
      await this.roleRepository.save(superAdminRole);
      this.logger.log('Super Admin role already exists, updated permissions.');
    }

    // Create ADMINISTRATOR role
    let adminRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.ADMINISTRATOR }
    });

    if (!adminRole) {
      adminRole = this.roleRepository.create({
        name: DefaultRole.ADMINISTRATOR,
        displayName: 'Administrator',
        description: 'Restaurant system administration',
        isSystem: true,
        permissions: allPermissions.filter(p => !p.name.includes('SUPER_'))
      });
      await this.roleRepository.save(adminRole);
      this.logger.log('Administrator role created with standard admin permissions.');
    }

    // Create USER role
    let userRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.USER }
    });

    if (!userRole) {
      // Get basic user permissions only
      const userPermissions = allPermissions.filter(p =>
        p.name.includes('USER_READ') || p.name.includes('PROFILE_')
      );

      userRole = this.roleRepository.create({
        name: DefaultRole.USER,
        displayName: 'Standard User',
        description: 'Regular application user',
        isSystem: true,
        permissions: userPermissions
      });
      await this.roleRepository.save(userRole);
      this.logger.log('User role created with basic permissions.');
    }
  }

  async seedAdmin() {
    // Get admin role
    const superAdminRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.SUPER_ADMIN },
      relations: ['permissions']
    });

    if (!superAdminRole) {
      this.logger.error('Super Admin role not found. Cannot create admin user.');
      return;
    }

    // Create default admin address
    const adminAddress = this.addressRepository.create({
      street: 'Admin Street',
      ward: 'Admin Ward',
      district: 'Admin District',
      city: 'Admin City'
    });
    await this.addressRepository.save(adminAddress);

    // Create admin user if it doesn't exist
    let adminUser = await this.userRepository.findOne({
      where: { username: 'admin' },
      relations: ['address']
    });

    if (!adminUser) {
      // Generate UUID for admin user (28 characters)
      const adminId = uuidv4().substring(0, 28);

      // Hash default password 'admin123' for admin
      const hashedPassword = await bcrypt.hash('admin123', 10);

      adminUser = this.userRepository.create({
        id: adminId,
        username: 'admin',
        password: hashedPassword,
        email: 'adminadmin@gmail.com',
        name: 'System Administrator',
        birthday: new Date(),
        role: superAdminRole,
        authProvider: AuthProvider.EMAIL,
        isActive: true
      });

      // Save user first to get ID
      adminUser = await this.userRepository.save(adminUser);

      // Now set up address relationship
      adminAddress.user = adminUser;
      await this.addressRepository.save(adminAddress);

      this.logger.log(`Admin user created with ID: ${adminId} and default password: admin123`);
    } else {
      this.logger.log('Admin user already exists.');

      // Update admin's address if needed
      if (!adminUser.address) {
        adminUser.address = adminAddress;
        await this.userRepository.save(adminUser);
        this.logger.log('Added address to existing admin user');
      }
    }
  }
}