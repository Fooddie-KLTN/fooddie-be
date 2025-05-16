import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';
import { Food } from 'src/entities/food.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Category } from 'src/entities/category.entity';
import { Order } from 'src/entities/order.entity';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Food, Restaurant, Category, Order, User, Role])],
  controllers: [FoodController],
  providers: [FoodService, UsersService, JwtService, GoogleCloudStorageService],
  exports: [FoodService],
})
export class FoodModule {}