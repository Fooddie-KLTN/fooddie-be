import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './role.guard';
import { UsersModule } from '../../modules/users/users.module';
import { AuthGuard } from 'src/auth/auth.guard';

/**
 * Module for handling authorization guards
 */
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => UsersModule), // Use forwardRef to break circular dependency
  ],
  providers: [RolesGuard, AuthGuard],
  exports: [RolesGuard, AuthGuard, JwtModule],
})
export class GuardModule {}