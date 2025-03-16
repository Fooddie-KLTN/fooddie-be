import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { Address } from 'src/entities/address.entity';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { Restaurant } from 'src/entities/restaurant.entity';
import { UsersService } from '../users/users.service';

@Module({
    imports: [TypeOrmModule.forFeature([Address, User, Role, Restaurant])],
    controllers: [AddressController],
    providers: [AddressService, UsersService],
    exports: [AddressService],
})
export class AddressModule {}
