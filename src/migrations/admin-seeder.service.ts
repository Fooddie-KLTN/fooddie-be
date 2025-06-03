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
        // Administrators get all permissions except those specifically for SUPER_ADMIN (if any)
        permissions: allPermissions.filter(p => !p.name.startsWith('SUPER_'))
      });
      await this.roleRepository.save(adminRole);
      this.logger.log('Administrator role created with standard admin permissions.');
    } else {
      adminRole.permissions = allPermissions.filter(p => !p.name.startsWith('SUPER_'));
      await this.roleRepository.save(adminRole);
      this.logger.log('Administrator role already exists, updated permissions.');
    }

    // Create USER role
    let userRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.USER }
    });

    if (!userRole) {
      // Get basic user permissions only
      const userPermissions = allPermissions.filter(p =>
        p.name.includes('USER_READ') || // General user read
        p.name.includes('PROFILE_') || // Manage own profile
        p.name.startsWith('ORDER_CREATE') || // Create orders
        p.name.startsWith('ORDER_READ') || // Read their own orders
        p.name.startsWith('REVIEW_CREATE') || // Create reviews
        p.name.startsWith('RESTAURANT_READ') || // View restaurants
        p.name.startsWith('FOOD_READ') // View food items
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
    } else {
      const userPermissions = allPermissions.filter(p =>
        p.name.includes('USER_READ') ||
        p.name.includes('PROFILE_') ||
        p.name.startsWith('ORDER_CREATE') ||
        p.name.startsWith('ORDER_READ') ||
        p.name.startsWith('REVIEW_CREATE') ||
        p.name.startsWith('RESTAURANT_READ') ||
        p.name.startsWith('FOOD_READ')
      );
      userRole.permissions = userPermissions;
      await this.roleRepository.save(userRole);
      this.logger.log('User role already exists, updated permissions.');
    }

    // Create SHOP_OWNER role
    let shopOwnerRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.SHOP_OWNER }
    });

    let shipperRole = await this.roleRepository.findOne({
      where: { name: DefaultRole.SHIPPER }
    });

    // Define permissions for Shop Owner
    // They can manage their own restaurant, food, orders, promotions.
    // They can read categories.
    const shopOwnerPermissions = allPermissions.filter(p =>
      p.name.startsWith('RESTAURANT_') || // Full CRUD for their restaurant (logic handled in services)
      p.name.startsWith('FOOD_') ||       // Full CRUD for their food items
      p.name.startsWith('ORDER_READ') ||   // Read orders for their restaurant
      p.name.startsWith('ORDER_UPDATE') || // Update order status for their restaurant
      p.name.startsWith('PROMOTION_CREATE') || // Create promotions for their restaurant
      p.name.startsWith('PROMOTION_READ') ||   // Read promotions for their restaurant
      p.name.startsWith('PROMOTION_UPDATE') || // Update promotions for their restaurant
      p.name.startsWith('PROMOTION_DELETE') || // Delete promotions for their restaurant
      p.name.startsWith('CATEGORY_READ') ||  // Read categories
      p.name.startsWith('PROFILE_') // Manage own profile
    );

    if (!shopOwnerRole) {
      shopOwnerRole = this.roleRepository.create({
        name: DefaultRole.SHOP_OWNER,
        displayName: 'Shop Owner',
        description: 'Manages their own restaurant and related operations',
        isSystem: false, // Typically not a system role like admin/super_admin
        permissions: shopOwnerPermissions
      });
      await this.roleRepository.save(shopOwnerRole);
      this.logger.log('Shop Owner role created with relevant permissions.');
    } else {
      // Optionally update permissions if the role exists
      shopOwnerRole.permissions = shopOwnerPermissions;
      await this.roleRepository.save(shopOwnerRole);
      this.logger.log('Shop Owner role already exists, updated permissions.');
    }

    if (!shipperRole) {
      shipperRole = this.roleRepository.create({
        name: DefaultRole.SHIPPER,
        displayName: 'Shipper',
        description: 'shipper role with limited permissions',
        isSystem: false, // Typically not a system role like admin/super_admin
        permissions: [],
      });
      await this.roleRepository.save(shipperRole);
      this.logger.log('Shipper role create.');
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

    const availableAddress = await this.addressRepository.findOne({
      where: { street: 'Admin Street', ward: 'Admin Ward', district: 'Admin District', city: 'Admin City' }
    });

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
      if (!availableAddress) {
              // Create default admin address
      const adminAddress = this.addressRepository.create({
        street: 'Admin Street',
        ward: 'Admin Ward',
        district: 'Admin District',
        city: 'Admin City'
      });
      await this.addressRepository.save(adminAddress);

        adminAddress.user = adminUser;
        await this.addressRepository.save(adminAddress);

      }

      this.logger.log(`Admin user created with ID: ${adminId} and default password: admin123`);
    } else {
      this.logger.log('Admin user already exists.');

    }
  }
}