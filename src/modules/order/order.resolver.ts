// src/order/order.resolver.ts
import { Resolver, Subscription, Args, Mutation, Context, Query } from '@nestjs/graphql';
import { pubSub } from 'src/pubsub';
import { Order } from 'src/entities/order.entity';
import { haversineDistance } from 'src/common/utils/helper';
import { Logger } from '@nestjs/common';

@Resolver(() => Order)
export class OrderResolver {
    private readonly logger = new Logger(OrderResolver.name);

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
            const logger = new Logger('OrderSubscriptionFilter');
            const order = payload.orderConfirmedForShippers;
            const shipperLat = parseFloat(variables.latitude);
            const shipperLng = parseFloat(variables.longitude);
            const maxDistance = variables.maxDistance || 99999; // Default 5km radius
            
            logger.log(`🔍 Running filter with variables: ${JSON.stringify(variables)}`);
            logger.log(`📦 Incoming order: ${JSON.stringify({
                id: order.id,
                status: order.status,
                restaurantId: order.restaurant?.id,
                restaurantName: order.restaurant?.name,
                restaurantLat: order.restaurant?.latitude,
                restaurantLng: order.restaurant?.longitude,
                hasShippingDetail: !!order.shippingDetail
            })}`);

            // Check if order has restaurant coordinates
            if (!order.restaurant?.latitude || !order.restaurant?.longitude) {
                logger.warn(`❌ Order ${order.id} restaurant has no coordinates`);
                return false;
            }

            // Calculate distance between shipper and restaurant
            const distance = haversineDistance(
                shipperLat,
                shipperLng,
                parseFloat(order.restaurant.latitude),
                parseFloat(order.restaurant.longitude)
            );

            logger.log(`📏 Distance calculated: ${distance}km (max: ${maxDistance}km)`);

            const shouldSend = (
                order.status === 'confirmed' &&
                distance <= maxDistance &&
                !order.shippingDetail // Order not yet assigned to a shipper
            );

            logger.log(`✅ Should send to shipper: ${shouldSend}`);
            logger.log(`📊 Filter criteria: status=${order.status}, distance=${distance}km, hasShipper=${!!order.shippingDetail}`);

            return shouldSend;
        },
        resolve: (payload) => {
            const logger = new Logger('OrderSubscriptionResolve');
            const order = payload.orderConfirmedForShippers;
            
            logger.log(`📩 Resolving subscription payload for order ${order.id}`);
            
            // Add distance info to the order for shipper reference
            const resolvedOrder = {
                ...order,
                distanceFromShipper: haversineDistance(
                    parseFloat(payload.shipperLat),
                    parseFloat(payload.shipperLng),
                    parseFloat(order.restaurant.latitude),
                    parseFloat(order.restaurant.longitude)
                )
            };

            logger.log(`🚀 Sending order ${order.id} to shipper`);
            return resolvedOrder;
        }
    })
    orderConfirmedForShippers(
        @Args('latitude') latitude: string,
        @Args('longitude') longitude: string,
        @Args('maxDistance', { nullable: true, defaultValue: 9999 }) maxDistance: number,
        @Context() context
    ) {
        this.logger.log(`🔗 New shipper subscription: lat=${latitude}, lng=${longitude}, maxDistance=${maxDistance}`);
        
        if (!latitude || !longitude) {
            this.logger.error('❌ Shipper latitude and longitude are required');
            throw new Error('Shipper latitude and longitude are required');
        }
        
        this.logger.log(`✅ Shipper subscribed successfully`);
        return (pubSub).asyncIterableIterator('orderConfirmedForShippers');
    }

    // Thêm một query đơn giản để hợp lệ schema
    @Query(() => String)
    orderHello() {
        return 'Order resolver is working!';
    }
}