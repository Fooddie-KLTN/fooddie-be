/* eslint-disable prettier/prettier */
import { TypeOrmModule } from '@nestjs/typeorm';
import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Role } from 'src/entities/role.entity';
import { User } from 'src/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/modules/users/users.service';
import { RolesService } from 'src/modules/role/role.service';
import { Permission } from 'src/entities/permission.entity';
import { AuthGuard } from './auth.guard';
import { UsersModule } from 'src/modules/users/users.module';
import { RoleModule } from 'src/modules/role/role.module';
import { Address } from 'src/entities/address.entity';
import { ShipperCertificateInfo } from 'src/entities/shipperCertificateInfo.entity';
import { MailingService } from 'src/nodemailer/send-mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, Address, ShipperCertificateInfo]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1d') 
        },
      }),      
      inject: [ConfigService],
    }),
    forwardRef(()=> UsersModule),
    forwardRef(()=> RoleModule)
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    RolesService,
    AuthGuard,
    ConfigService,
    MailingService
  ],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule { }
