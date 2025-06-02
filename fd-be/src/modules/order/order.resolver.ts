// src/order/order.resolver.ts
import { Resolver, Subscription, Args, Mutation, Context, Query } from '@nestjs/graphql';
import { pubSub } from 'src/pubsub';
import { Order } from 'src/entities/order.entity';

@Resolver(() => Order)
export class OrderResolver {
    // Subscription for new pending orders for a restaurant
    @Subscription(() => Order, {
        filter: (payload, variables, context) => {
            // context.token là JWT
            // Giải mã token để lấy userId nếu cần
            const token = context.token;
            
            return (
                payload.orderCreated.restaurant.id === variables.restaurantId &&
                payload.orderCreated.status === 'pending' 
            );
        },
        resolve: (payload) => payload.orderCreated
    })
    orderCreated(
        @Args('restaurantId') restaurantId: string,
        @Context() context
    ) {
       
        // Có thể kiểm tra context.token ở đây nếu muốn
        if (!restaurantId) {
            throw new Error('restaurantId is required for orderCreated subscription');
        }
        return (pubSub).asyncIterableIterator('orderCreated');
    }

    // NEW: Subscription for users to get order status updates
    @Subscription(() => Order, {
        filter: (payload, variables, context) => {
            // Notify user when their order status changes
            return (
                payload.orderStatusUpdated.user.id === variables.userId &&
                ['confirmed', 'delivering', 'completed', 'canceled'].includes(payload.orderStatusUpdated.status)
            );
        },
        resolve: (payload) => payload.orderStatusUpdated
    })
    orderStatusUpdated(
        @Args('userId') userId: string,
        @Context() context
    ) {
        if (!userId) {
            throw new Error('userId is required for orderStatusUpdated subscription');
        }
        return (pubSub).asyncIterableIterator('orderStatusUpdated');
    }

    // Thêm một query đơn giản để hợp lệ schema
    @Query(() => String)
    orderHello() {
        return 'Order resolver is working!';
    }
}