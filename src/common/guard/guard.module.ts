import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './role.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { UsersService } from 'src/modules/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { User } from 'src/entities/user.entity';
import { Address } from 'src/entities/address.entity';

/**
 * Module for handling authorization guards
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Role, Permission, User, Address]), 

  ],
  providers: [RolesGuard, AuthGuard, UsersService],
  exports: [RolesGuard, AuthGuard, JwtModule],
})
export class GuardModule {}