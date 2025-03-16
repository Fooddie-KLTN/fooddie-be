import { Module } from '@nestjs/common';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Address } from 'src/entities/address.entity';
import { Food } from 'src/entities/food.entity';
import { Promotion } from 'src/entities/promotion.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { Role } from 'src/entities/role.entity';
import { UsersService } from '../users/users.service';

@Module({
    imports: [ TypeOrmModule.forFeature([Restaurant, User, Role, Address, Food, Promotion])
    ],
    controllers: [RestaurantController],
    providers: [RestaurantService, UsersService],
    exports: [RestaurantService]
})
export class RestaurantModule {}