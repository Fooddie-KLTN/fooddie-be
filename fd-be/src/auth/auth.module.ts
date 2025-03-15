/* eslint-disable prettier/prettier */
import { TypeOrmModule } from "@nestjs/typeorm";
import { Module } from "@nestjs/common";
import { Role } from "src/migrations/entities/role.entity";
import { User } from "src/migrations/entities/user.entity";
import { AuthController } from "./auth.controller";
import { FirebaseService } from "./firebase.service";
import { UsersModule } from "src/modules/users/users.module";
import { AuthService } from "./auth.service";

@Module({
    imports: [TypeOrmModule.forFeature([User, Role]),
UsersModule],
    controllers: [AuthController],
    providers: [FirebaseService, AuthService],    
    exports: [FirebaseService],
})
export class AuthModule {}