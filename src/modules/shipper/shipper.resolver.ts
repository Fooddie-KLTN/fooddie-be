import { Resolver, Subscription, Args, Context } from '@nestjs/graphql';
import { pubSub } from 'src/pubsub';
import { ShipperLocation } from './shipper-location.type';
import { WebSocketAuthGuard } from 'src/auth/websocket-auth.guard';
import { Order } from 'src/entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class ShipperResolver {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Subscription(() => ShipperLocation, {
    filter: async (payload, variables, context) => {
      // Find the order and check if the user is the owner
      const order = await context.orderRepository.findOne({
        where: { id: variables.orderId },
        relations: ['user', 'shippingDetail', 'shippingDetail.shipper'],
      });
      // Only allow the user who owns the order to receive updates
      return (
        order &&
        order.user.id === context.connection.context.user.id &&
        payload.shipperLocationUpdated.shipperId === order.shippingDetail?.shipper?.id
      );
    },
  })
  @UseGuards(WebSocketAuthGuard)
  shipperLocationUpdated(
    @Args('orderId') orderId: string,
    @Context() context: any
  ) {
    // Optionally, you can check order ownership here as well
    return pubSub.asyncIterableIterator('shipperLocationUpdated');
  }
}