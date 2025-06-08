import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromotionService } from './promotion.service';
import { PromotionController } from './promotion.controller';
import { Promotion } from 'src/entities/promotion.entity';
import { Food } from 'src/entities/food.entity';
import { Order } from 'src/entities/order.entity';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { UsersService } from '../users/users.service';
import { Address } from 'src/entities/address.entity';
import { GoogleCloudStorageService } from 'src/gcs/gcs.service';
import { GuardModule } from 'src/common/guard/guard.module'; // Import GuardModule instead

@Module({
    imports: [
        TypeOrmModule.forFeature([Promotion, Food, Order, User, Role, Address]), 
        GuardModule // Use GuardModule instead of JwtModule
    ],
    controllers: [PromotionController],
    providers: [PromotionService, UsersService, GoogleCloudStorageService],
    exports: [PromotionService],
})
export class PromotionModule {}
