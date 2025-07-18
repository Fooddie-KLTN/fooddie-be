/* eslint-disable prettier/prettier */
// src/roles/role.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { RolesService } from './role.service';
import { RoleController } from './role.controller';
import { User } from 'src/entities/user.entity';
import { UsersService } from 'src/modules/users/users.service';
import { Permission } from 'src/entities/permission.entity';
import { JwtService } from '@nestjs/jwt';
import { Address } from 'src/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User, Permission, Address])
  ],
  providers: [RolesService, UsersService, JwtService],
  controllers: [RoleController],
  exports: [
    RolesService,
    TypeOrmModule,
  ],
})
export class RoleModule {}

