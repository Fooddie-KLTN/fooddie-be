import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PendingShipperAssignment } from 'src/entities/pendingShipperAssignment.entity';
import { Order } from 'src/entities/order.entity';
import { QueueService } from './queue.service';
import { QueueNames } from './queue.constants';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PendingAssignmentService {
  private readonly logger = new Logger(PendingAssignmentService.name);

  constructor(
    @InjectRepository(PendingShipperAssignment)
    private pendingAssignmentRepository: Repository<PendingShipperAssignment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private queueService: QueueService,
  ) {}

  /**
   * Add a confirmed order to pending assignments
   */
  async addPendingAssignment(orderId: string, priority: number = 1): Promise<PendingShipperAssignment> {
    // Check if assignment already exists
    const existing = await this.pendingAssignmentRepository.findOne({
      where: { order: { id: orderId } }
    });

    if (existing) {
      this.logger.warn(`Pending assignment already exists for order ${orderId}`);
      return existing;
    }

    // Get the order
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant', 'user', 'address', 'orderDetails', 'orderDetails.food', 'shippingDetail']
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== 'confirmed') {
      throw new Error(`Order ${orderId} is not confirmed (status: ${order.status})`);
    }

    if (order.shippingDetail) {
      throw new Error(`Order ${orderId} is already assigned to a shipper`);
    }

    // Create pending assignment
    const pendingAssignment = this.pendingAssignmentRepository.create({
      order,
      priority,
      attemptCount: 0,
      nextAttemptAt: new Date(), // Try immediately
    });

    const saved = await this.pendingAssignmentRepository.save(pendingAssignment);

    // Queue the job immediately for the first attempt
    await this.queueService.addJob(
      QueueNames.FIND_SHIPPER,
      { 
        pendingAssignmentId: saved.id,
        orderId: order.id,
        attempt: 1
      },
      { 
        retryLimit: 0, // We'll handle retries manually
        expireInMinutes: 10 // Job expires in 10 minutes
      }
    );

    this.logger.log(`Added pending assignment ${saved.id} for order ${orderId}`);
    return saved;
  }

  /**
   * Remove pending assignment when order is assigned
   */
  async removePendingAssignment(orderId: string): Promise<void> {
    const result = await this.pendingAssignmentRepository.delete({
      order: { id: orderId }
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Removed pending assignment for order ${orderId}`);
    }
  }

  /**
   * Update attempt count and schedule next attempt
   */
  async updateAttempt(pendingAssignmentId: string, success: boolean = false): Promise<void> {
    const assignment = await this.pendingAssignmentRepository.findOne({
      where: { id: pendingAssignmentId },
      relations: ['order']
    });

    if (!assignment) {
      this.logger.warn(`Pending assignment ${pendingAssignmentId} not found`);
      return;
    }

    if (success) {
      // Remove the assignment if successful
      await this.pendingAssignmentRepository.remove(assignment);
      this.logger.log(`Successfully assigned order ${assignment.order.id}, removed from pending`);
      return;
    }

    // Update attempt count
    assignment.attemptCount += 1;
    assignment.lastAttemptAt = new Date();

    // Calculate next attempt time with exponential backoff
    const backoffMinutes = Math.min(assignment.attemptCount * 5, 30); // Max 30 minutes
    assignment.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

    // Stop retrying after 5 attempts or 2 hours
    const maxAttempts = 5;
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours
    const isExpired = Date.now() - assignment.createdAt.getTime() > maxAge;

    if (assignment.attemptCount >= maxAttempts || isExpired) {
      assignment.notes = `Max attempts reached (${assignment.attemptCount}) or expired`;
      await this.pendingAssignmentRepository.save(assignment);
      this.logger.warn(`Order ${assignment.order.id} assignment abandoned after ${assignment.attemptCount} attempts`);
      return;
    }

    await this.pendingAssignmentRepository.save(assignment);

    // Schedule next attempt
    await this.queueService.addJob(
      QueueNames.FIND_SHIPPER,
      {
        pendingAssignmentId: assignment.id,
        orderId: assignment.order.id,
        attempt: assignment.attemptCount + 1
      },
      {
        startAfter: Math.floor(backoffMinutes * 60), // Delay in seconds
        retryLimit: 0,
        expireInMinutes: 10
      }
    );

    this.logger.log(`Scheduled retry ${assignment.attemptCount + 1} for order ${assignment.order.id} in ${backoffMinutes} minutes`);
  }

  /**
   * Get all pending assignments ready for processing
   */
  async getPendingAssignments(limit: number = 10): Promise<PendingShipperAssignment[]> {
    return this.pendingAssignmentRepository.find({
      where: {
        nextAttemptAt: LessThan(new Date())
      },
      relations: ['order', 'order.restaurant', 'order.user', 'order.address'],
      order: {
        priority: 'DESC',
        createdAt: 'ASC'
      },
      take: limit
    });
  }

  /**
   * Cleanup old pending assignments
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredAssignments(): Promise<void> {
    const cutoffTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago

    const result = await this.pendingAssignmentRepository.delete({
      createdAt: LessThan(cutoffTime)
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned up ${result.affected} expired pending assignments`);
    }
  }
}