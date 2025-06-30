import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessengerController } from './messenger.controller';
import { MessengerService } from './messenger.service';
import { MessengerResolver } from './messenger.resolver';
import { Conversation } from 'src/entities/conversation.entity';
import { Message } from 'src/entities/message.entity';
import { User } from 'src/entities/user.entity';
import { Order } from 'src/entities/order.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { ShippingDetail } from 'src/entities/shippingDetail.entity';
import { UsersModule } from '../users/users.module';
import { RestaurantModule } from '../restaurant/restaurant.module';
import { JwtModule } from '@nestjs/jwt';
import { Notification } from 'src/entities/notification.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Conversation, 
            Message, 
            User, 
            Order, 
            Restaurant, 
            ShippingDetail,
            Notification
        ]),
        UsersModule,
        RestaurantModule,
        JwtModule
    ],
    controllers: [MessengerController],
    providers: [MessengerService, MessengerResolver],
    exports: [MessengerService],
})
export class MessengerModule {}