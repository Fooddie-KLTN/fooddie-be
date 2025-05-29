// src/order/order.resolver.ts
import { Resolver, Subscription, Args, Mutation } from '@nestjs/graphql';
import { pubSub } from 'src/pubsub';
import { Order } from 'src/entities/order.entity';

@Resolver(() => Order)
export class OrderResolver {
  // Subscription for new pending orders for a restaurant
  @Subscription(() => Order, {
    filter: (payload, variables) =>
      payload.orderCreated.restaurant.id === variables.restaurantId &&
      payload.orderCreated.status === 'pending',
  })
  orderCreated(
    @Args('restaurantId') restaurantId: string,
  ) {
    return (pubSub as any).asyncIterator('orderCreated');
  }

}