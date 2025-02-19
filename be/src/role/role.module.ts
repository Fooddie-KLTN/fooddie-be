/* eslint-disable prettier/prettier */
// src/roles/role.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { User } from 'src/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User])],
  providers: [RoleService, UsersService],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
