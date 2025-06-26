import { Resolver, Subscription, Query, Args, Context } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { Notification } from 'src/entities/notification.entity';
import { pubSub } from 'src/pubsub';
import { UseGuards } from '@nestjs/common';
import { WebSocketAuthGuard } from 'src/auth/websocket-auth.guard';
import { AuthGuard } from 'src/auth/auth.guard';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private notificationService: NotificationService) {}

  @Query(() => [Notification])
  @UseGuards(AuthGuard) // <-- Use AuthGuard for queries
  async getUserNotifications(@Context() context: any) {
    const userId = context.req.user.uid || context.req.user.id;
    return this.notificationService.getUserNotifications(userId);
  }

  @Subscription(() => Notification, {
    filter: (payload, variables, context) =>
      payload.notificationAdded.receiveUser === context.connection.context.user.id,
  })
  @UseGuards(WebSocketAuthGuard)
  notificationAdded(@Context() context: any) {
    return pubSub.asyncIterableIterator('notificationAdded');
  }
}