import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from 'src/entities/notification.entity';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async getUserNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { receiveUser: userId },
      order: { createdAt: 'DESC' },
    });
  }
}