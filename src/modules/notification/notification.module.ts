import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]),
    JwtModule
],
  providers: [NotificationService, NotificationResolver],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}