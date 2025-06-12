import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import * as PgBoss from 'pg-boss';
import { PG_BOSS_INSTANCE } from './pg-boss.module';
import { QueueNames } from './queue.constants';
import { PendingAssignmentService } from './pending-assignment.service';
import { pubSub } from 'src/pubsub';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/entities/order.entity';

interface FindShipperJobData {
  pendingAssignmentId: string;
  orderId: string;
  attempt: number;
}

@Injectable()
export class ShipperAssignmentWorker implements OnModuleInit {
  private readonly logger = new Logger(ShipperAssignmentWorker.name);

  constructor(
    @Inject(PG_BOSS_INSTANCE) private readonly boss: PgBoss,
    private pendingAssignmentService: PendingAssignmentService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async onModuleInit() {
    // Register job handlers with correct pg-boss options
    await this.boss.work(QueueNames.FIND_SHIPPER, {
      batchSize: 2, // Process up to 2 jobs at once
    }, this.handleFindShipper.bind(this));

    this.logger.log('Shipper assignment worker initialized and ready to process jobs');
  }

  /**
   * Handle find shipper jobs
   */
  private async handleFindShipper(job: PgBoss.Job<FindShipperJobData>) {
    const { pendingAssignmentId, orderId, attempt } = job.data;
    
    this.logger.log(`Processing find shipper job for order ${orderId} (attempt ${attempt})`);

    try {
      // Get the current order status
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['restaurant', 'user', 'address', 'orderDetails', 'orderDetails.food', 'shippingDetail']
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found, removing from queue`);
        await this.pendingAssignmentService.removePendingAssignment(orderId);
        return;
      }

      // Check if order is still available for assignment
      if (order.status !== 'confirmed') {
        this.logger.log(`Order ${orderId} status changed to ${order.status}, removing from queue`);
        await this.pendingAssignmentService.removePendingAssignment(orderId);
        return;
      }

      if (order.shippingDetail) {
        this.logger.log(`Order ${orderId} already assigned to shipper, removing from queue`);
        await this.pendingAssignmentService.removePendingAssignment(orderId);
        return;
      }

      // Publish to GraphQL subscription for shippers
      await pubSub.publish('orderConfirmedForShippers', {
        orderConfirmedForShippers: order
      });

      this.logger.log(`Published order ${orderId} to shipper subscription (attempt ${attempt})`);

      // Wait a bit to see if any shipper picks up the order
      await this.delay(30000); // Wait 30 seconds

      // Check if order was assigned during the wait
      const updatedOrder = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['shippingDetail']
      });

      if (updatedOrder?.shippingDetail) {
        // Order was assigned, mark as successful
        await this.pendingAssignmentService.updateAttempt(pendingAssignmentId, true);
        this.logger.log(`Order ${orderId} was successfully assigned during attempt ${attempt}`);
      } else {
        // No shipper picked up the order, schedule retry
        await this.pendingAssignmentService.updateAttempt(pendingAssignmentId, false);
        this.logger.log(`No shipper picked up order ${orderId} during attempt ${attempt}, scheduling retry`);
      }

    } catch (error) {
      this.logger.error(`Error processing find shipper job for order ${orderId}:`, error);
      
      // Mark attempt as failed, which will schedule a retry
      try {
        await this.pendingAssignmentService.updateAttempt(pendingAssignmentId, false);
      } catch (updateError) {
        this.logger.error(`Failed to update attempt for assignment ${pendingAssignmentId}:`, updateError);
      }
      
      throw error; // Re-throw to mark job as failed
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}