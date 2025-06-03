// src/order/order.resolver.ts
import { Resolver, Subscription, Args, Mutation, Context, Query } from '@nestjs/graphql';
import { pubSub } from 'src/pubsub';
import { Order } from 'src/entities/order.entity';
import { haversineDistance } from 'src/common/utils/helper';

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

    // NEW: Subscription for shippers to get nearby confirmed orders
    @Subscription(() => Order, {
        filter: (payload, variables, context) => {
            const order = payload.orderConfirmedForShippers;
            const shipperLat = parseFloat(variables.latitude);
            const shipperLng = parseFloat(variables.longitude);
            const maxDistance = variables.maxDistance || 5; // Default 5km radius
            console.log('[🔍] Running filter with variables:', variables);
            console.log('[📦] Incoming order:', payload.orderConfirmedForShippers);
            // Check if order has restaurant coordinates
            if (!order.restaurant?.latitude || !order.restaurant?.longitude) {
                return false;
            }

            // Calculate distance between shipper and restaurant
            const distance = haversineDistance(
                shipperLat,
                shipperLng,
                parseFloat(order.restaurant.latitude),
                parseFloat(order.restaurant.longitude)
            );

            // Only send orders within the specified radius and confirmed status
            return (
                order.status === 'confirmed' &&
                distance <= maxDistance &&
                !order.shippingDetail // Order not yet assigned to a shipper
            );
        },
        resolve: (payload) => {
            const order = payload.orderConfirmedForShippers;
            console.log('[📩] Sub payload:', payload.orderConfirmedForShippers);
            // Add distance info to the order for shipper reference
            return {
                ...order,
                distanceFromShipper: haversineDistance(
                    parseFloat(payload.shipperLat),
                    parseFloat(payload.shipperLng),
                    parseFloat(order.restaurant.latitude),
                    parseFloat(order.restaurant.longitude)
                )
            };
        }
    })
    orderConfirmedForShippers(
        @Args('latitude') latitude: string,
        @Args('longitude') longitude: string,
        @Args('maxDistance', { nullable: true, defaultValue: 5 }) maxDistance: number,
        @Context() context
    ) {
        if (!latitude || !longitude) {
            throw new Error('Shipper latitude and longitude are required');
        }
        return (pubSub).asyncIterableIterator('orderConfirmedForShippers');
    }

    // Thêm một query đơn giản để hợp lệ schema
    @Query(() => String)
    orderHello() {
        return 'Order resolver is working!';
    }
}