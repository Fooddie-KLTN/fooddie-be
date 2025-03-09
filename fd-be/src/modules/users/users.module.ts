import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Role } from 'src/entities/role.entity';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UsersController],
  providers: [UsersService
  ],
  exports: [UsersService],
})
export class UsersModule {}
