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
        return (pubSub).asyncIterableIterator('orderCreated');
    }

    // Thêm một query đơn giản để hợp lệ schema
    @Query(() => String)
    orderHello() {
        return 'Order resolver is working!';
    }
}