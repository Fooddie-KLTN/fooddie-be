
import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Food } from 'src/entities/food.entity';
import { Category } from 'src/entities/category.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Role } from 'src/entities/role.entity';
import { UsersService } from '../users/users.service';
import { Address } from 'src/entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, User,Role, Food, Restaurant, Address ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService, UsersService],
  exports: [CategoryService]
})
export class CategoryModule {}