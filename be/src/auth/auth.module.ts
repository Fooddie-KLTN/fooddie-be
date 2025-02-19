/* eslint-disable prettier/prettier */
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { Role } from "src/entities/role.entity";
import { User } from "src/entities/user.entity";
import { AuthController } from "./auth.controller";
import { FirebaseService } from "./firebase.service";
import { UsersModule } from "src/users/users.module";

@Module({
    imports: [TypeOrmModule.forFeature([User, Role]),
UsersModule],
    controllers: [AuthController],
    providers: [FirebaseService],    
    exports: [FirebaseService],
})
export class AuthModule {}