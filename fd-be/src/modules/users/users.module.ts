import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Role } from 'src/entities/role.entity';
import { JwtService } from '@nestjs/jwt';
import { Address } from 'src/entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Address])],
  controllers: [UsersController],
  providers: [UsersService,
    JwtService
  ],
  exports: [UsersService],
})
export class UsersModule {}
