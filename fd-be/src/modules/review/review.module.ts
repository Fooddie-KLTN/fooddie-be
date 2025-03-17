import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Review } from 'src/entities/review.entity';
import { Role } from 'src/entities/role.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { User } from 'src/entities/user.entity';
import { UsersService } from '../users/users.service';

@Module({
    imports: [TypeOrmModule.forFeature([Review, User, Restaurant, Role])],
    controllers: [ReviewController],
    providers: [ReviewService, UsersService],
    exports: [ReviewService],
})
export class ReviewModule {}
