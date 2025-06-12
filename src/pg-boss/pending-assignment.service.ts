import { Injectable, Logger, InternalServerErrorException, OnModuleInit, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PendingShipperAssignment } from 'src/entities/pendingShipperAssignment.entity';
import { Order } from 'src/entities/order.entity';
import { QueueService } from './queue.service';
import { QueueNames, FindShipperJobData } from './queue.constants';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as PgBoss from 'pg-boss';
import { PG_BOSS_INSTANCE } from './pg-boss.module';
import { pubSub } from 'src/pubsub';

interface QueueShipperAssignmentInput {
  readonly orderId: string;
  readonly priority?: number;
}

interface QueueShipperAssignmentOutput {
  readonly jobId: string;
  readonly assignmentId: string;
}

@Injectable()
export class PendingAssignmentService implements OnModuleInit {
  private readonly logger = new Logger(PendingAssignmentService.name);
  private workerId: string | null = null;

  constructor(
    @InjectRepository(PendingShipperAssignment)
    private pendingAssignmentRepository: Repository<PendingShipperAssignment>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private queueService: QueueService,
    @Inject(PG_BOSS_INSTANCE) private readonly boss: PgBoss,
  ) {
    this.logger.log('🏗️ PendingAssignmentService constructor called');
  }

  /**
   * Initialize the worker when the module starts
   */
  async onModuleInit(): Promise<void> {
    this.logger.log(`📝 PendingAssignmentService onModuleInit called!`);
    this.logger.log(`📝 Registering worker for queue: ${QueueNames.FIND_SHIPPER}`);
    
    // Give pg-boss time to fully initialize
    setTimeout(async () => {
      try {
        this.logger.log(`🚀 Starting worker registration after delay...`);
        
        // Worker options following pg-boss documentation
        const workerOptions = {
          batchSize: 1,
          pollingIntervalSeconds: 1,
          includeMetadata: false,
          priority: true
        };

        this.logger.log(`⚙️ Worker options: ${JSON.stringify(workerOptions)}`);

        // Register worker with correct handler signature
        this.workerId = await this.boss.work(
          QueueNames.FIND_SHIPPER,
          workerOptions,
          this.handleFindShipperJobs.bind(this)
        );
        
        this.logger.log(`✅ Worker for ${QueueNames.FIND_SHIPPER} registered successfully with ID: ${this.workerId}`);
        
        // Perform initial check for existing pending assignments
        setTimeout(async () => {
          this.logger.log(`🔍 Performing initial check for pending assignments...`);
          await this.checkPendingAssignmentsAndCreateJobs();
        }, 2000);
        
      } catch (error) {
        this.logger.error(`❌ Failed to register worker for ${QueueNames.FIND_SHIPPER}: ${error.message}`, error.stack);
      }
    }, 3000);

    this.logger.log(`📝 PendingAssignmentService onModuleInit completed setup`);
  }

  /**
   * Daily check for pending assignments in database and create jobs for them
   * This is the main method that acts as a daily database check
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Daily at midnight
  @Cron(CronExpression.EVERY_10_MINUTES) // Also check every 10 minutes for testing
  async checkPendingAssignmentsAndCreateJobs(): Promise<void> {
    this.logger.log('🔍 === DAILY CHECK: Scanning database for pending shipper assignments ===');
    
    try {
      // Find all pending assignments that need processing
      const pendingAssignments = await this.pendingAssignmentRepository.find({
        where: {
          nextAttemptAt: LessThan(new Date()) // Only assignments ready for processing
        },
        relations: ['order', 'order.restaurant', 'order.user', 'order.address', 'order.shippingDetail'],
        order: {
          priority: 'DESC', // Higher priority first
          createdAt: 'ASC'  // Older orders first within same priority
        },
        take: 50 // Limit to prevent overwhelming the system
      });

      this.logger.log(`📊 Found ${pendingAssignments.length} pending assignments in database`);

      if (pendingAssignments.length === 0) {
        this.logger.log('✅ No pending assignments found in database');
        return;
      }

      // Process each pending assignment
      let jobsCreated = 0;
      let assignmentsRemoved = 0;

      for (const assignment of pendingAssignments) {
        try {
          // Validate the order is still valid for assignment
          const isValid = await this.validatePendingAssignment(assignment);
          
          if (!isValid) {
            // Remove invalid assignment
            await this.pendingAssignmentRepository.remove(assignment);
            assignmentsRemoved++;
            continue;
          }

          // Create a job to process this assignment
          const jobId = await this.createJobForPendingAssignment(assignment);
          
          if (jobId) {
            jobsCreated++;
            this.logger.log(`✅ Created job ${jobId} for pending assignment ${assignment.id}`);
          }

        } catch (error) {
          this.logger.error(`❌ Error processing pending assignment ${assignment.id}:`, error);
        }
      }

      this.logger.log(`🎯 Daily check completed: ${jobsCreated} jobs created, ${assignmentsRemoved} invalid assignments removed`);

    } catch (error) {
      this.logger.error('❌ Error during daily pending assignments check:', error);
    }
  }

  /**
   * Validate if a pending assignment is still valid for processing
   */
  private async validatePendingAssignment(assignment: PendingShipperAssignment): Promise<boolean> {
    const order = assignment.order;

    // Check if order still exists and is in confirmed status
    if (!order || order.status !== 'confirmed') {
      this.logger.log(`❌ Assignment ${assignment.id}: Order ${order?.id} is not confirmed (status: ${order?.status})`);
      return false;
    }

    // Check if order is already assigned to a shipper
    if (order.shippingDetail) {
      this.logger.log(`❌ Assignment ${assignment.id}: Order ${order.id} already assigned to shipper`);
      return false;
    }

    // Check if assignment has exceeded maximum attempts or age
    const maxAttempts = 10;
    const maxAgeHours = 24; // 24 hours
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    const isExpired = Date.now() - assignment.createdAt.getTime() > maxAge;

    if (assignment.attemptCount >= maxAttempts || isExpired) {
      this.logger.log(`❌ Assignment ${assignment.id}: Exceeded max attempts (${assignment.attemptCount}) or expired`);
      return false;
    }

    return true;
  }

  /**
   * Create a job for a pending assignment to find and notify the nearest shipper
   */
  private async createJobForPendingAssignment(assignment: PendingShipperAssignment): Promise<string | null> {
    try {
      const jobData: FindShipperJobData = {
        pendingAssignmentId: assignment.id,
        orderId: assignment.order.id,
        attempt: assignment.attemptCount + 1
      };

      const jobOptions = {
        retryLimit: 3,
        expireInMinutes: 15,
        retryDelay: 5000,
        priority: assignment.priority
      };

      const jobId = await this.queueService.addJob(
        QueueNames.FIND_SHIPPER,
        jobData,
        jobOptions
      );

      this.logger.log(`📤 Queued job ${jobId} for assignment ${assignment.id}, order ${assignment.order.id}`);
      return jobId;

    } catch (error) {
      this.logger.error(`❌ Failed to create job for assignment ${assignment.id}:`, error);
      return null;
    }
  }

  /**
   * Handle incoming shipper assignment jobs
   * This processes the jobs created by the daily check
   */
  private async handleFindShipperJobs(jobs: PgBoss.Job<FindShipperJobData>[]): Promise<void> {
    this.logger.log(`🔥 Processing ${jobs.length} shipper assignment jobs`);
    
    if (!jobs || jobs.length === 0) {
      this.logger.warn('⚠️ Received empty jobs array');
      return;
    }

    for (const job of jobs) {
      if (!job) {
        this.logger.warn('⚠️ Received null/undefined job in batch');
        continue;
      }

      this.logger.log(`📨 Processing job ${job.id} for finding nearest shipper`);

      try {
        await this.processShipperAssignmentJob(job);
        this.logger.log(`✅ Successfully processed job ${job.id}`);
      } catch (error) {
        this.logger.error(`❌ Error processing job ${job.id}: ${error.message}`, error.stack);
        throw error;
      }
    }
  }

  /**
   * Process a single shipper assignment job - find and notify nearest shipper
   */
  private async processShipperAssignmentJob(job: PgBoss.Job<FindShipperJobData>): Promise<void> {
    if (!job?.data || !this.isValidJobData(job.data)) {
        this.logger.error(`❌ Received invalid job data: ${JSON.stringify(job)}`);
        throw new Error('Invalid job data');
    }

    const { pendingAssignmentId, orderId, attempt } = job.data;
    
    this.logger.log(`🎯 === PROCESSING SHIPPER ASSIGNMENT FOR ORDER ${orderId} ===`);
    this.logger.log(`🔄 Job ID: ${job.id}, Assignment ID: ${pendingAssignmentId}, Attempt: ${attempt}`);

    try {
        // Get the pending assignment and order details
        const assignment = await this.pendingAssignmentRepository.findOne({
            where: { id: pendingAssignmentId },
            relations: ['order', 'order.restaurant', 'order.user', 'order.address', 'order.orderDetails', 'order.orderDetails.food']
        });

        if (!assignment) {
            this.logger.warn(`⚠️ Pending assignment ${pendingAssignmentId} not found`);
            return;
        }

        const order = assignment.order;

        // Validate order is still assignable
        if (order.status !== 'confirmed') {
            this.logger.log(`❌ Order ${orderId} status changed to ${order.status}, removing assignment`);
            await this.pendingAssignmentRepository.remove(assignment);
            return;
        }

        // Check if already assigned
        const currentOrder = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['shippingDetail']
        });

        if (currentOrder?.shippingDetail) {
            this.logger.log(`✅ Order ${orderId} already assigned, removing from pending`);
            await this.pendingAssignmentRepository.remove(assignment);
            return;
        }

        // Log order details for shipper notification
        this.logger.log(`📦 Order Details:`);
        this.logger.log(`   🏪 Restaurant: ${order.restaurant?.name} (${order.restaurant?.id})`);
        this.logger.log(`   👤 Customer: ${order.user?.username} (${order.user?.id})`);
        this.logger.log(`   📍 Delivery Address: ${order.address?.street}, ${order.address?.ward}`);
        this.logger.log(`   💰 Total: ${order.total}`);
        
        if (order.restaurant) {
            this.logger.log(`   🗺️ Restaurant Location: lat=${order.restaurant.latitude}, lng=${order.restaurant.longitude}`);
        }

        // NEW: Continuous publishing approach
        const publishIntervalSeconds = 10; // Publish every 10 seconds
        const maxPublishTime = 60; // Maximum time to keep publishing (60 seconds)
        const publishInterval = publishIntervalSeconds * 1000;
        const maxPublishDuration = maxPublishTime * 1000;
        
        this.logger.log(`📡 Starting continuous publishing for order ${orderId} every ${publishIntervalSeconds}s for ${maxPublishTime}s...`);
        
        const startTime = Date.now();
        let publishCount = 0;
        
        const publishLoop = async (): Promise<boolean> => {
            while (Date.now() - startTime < maxPublishDuration) {
                // Check if order was picked up
                const checkOrder = await this.orderRepository.findOne({
                    where: { id: orderId },
                    relations: ['shippingDetail', 'shippingDetail.shipper']
                });

                if (checkOrder?.shippingDetail) {
                    this.logger.log(`🎉 SUCCESS: Order ${orderId} was assigned to shipper ${checkOrder.shippingDetail.shipper?.username} after ${publishCount + 1} publications`);
                    await this.pendingAssignmentRepository.remove(assignment);
                    return true;
                }

                // Publish order to GraphQL subscription
                publishCount++;
                this.logger.log(`📡 Publishing order ${orderId} to shippers (attempt ${publishCount})...`);
                
                await pubSub.publish('orderConfirmedForShippers', {
                    orderConfirmedForShippers: order
                });
                
                this.logger.log(`✅ Published order ${orderId} to shipper subscription (${publishCount}/${Math.ceil(maxPublishTime / publishIntervalSeconds)})`);
                
                // Wait before next publication
                await this.delay(publishInterval);
            }
            
            return false; // Timeout reached
        };

        // Run the continuous publishing
        const wasAssigned = await publishLoop();
        
        if (!wasAssigned) {
            // No shipper picked up the order, schedule retry
            this.logger.log(`😞 No shipper accepted order ${orderId} after ${publishCount} publications, scheduling retry...`);
            await this.scheduleRetryForAssignment(assignment);
        }

        this.logger.log(`🎯 === COMPLETED PROCESSING FOR ORDER ${orderId} ===`);

    } catch (error) {
        this.logger.error(`💥 Error processing shipper assignment job ${job.id}:`, error);
        
        // Update assignment attempt count on error
        try {
            const assignment = await this.pendingAssignmentRepository.findOne({
                where: { id: pendingAssignmentId }
            });
            if (assignment) {
                await this.scheduleRetryForAssignment(assignment);
            }
        } catch (updateError) {
            this.logger.error(`💥 Failed to update assignment after error:`, updateError);
        }
        
        throw error;
    }
  }

  /**
   * Schedule a retry for a failed assignment attempt
   */
  private async scheduleRetryForAssignment(assignment: PendingShipperAssignment): Promise<void> {
    assignment.attemptCount += 1;
    assignment.lastAttemptAt = new Date();

    // Calculate next attempt time with exponential backoff
    const backoffMinutes = Math.min(assignment.attemptCount * 10, 60); // Max 1 hour
    assignment.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

    // Check if we should stop retrying
    const maxAttempts = 10;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const isExpired = Date.now() - assignment.createdAt.getTime() > maxAge;

    if (assignment.attemptCount >= maxAttempts || isExpired) {
      assignment.notes = `Assignment abandoned: ${assignment.attemptCount} attempts, expired: ${isExpired}`;
      await this.pendingAssignmentRepository.save(assignment);
      this.logger.warn(`😞 Abandoning assignment ${assignment.id} for order ${assignment.order.id} after ${assignment.attemptCount} attempts`);
      return;
    }

    await this.pendingAssignmentRepository.save(assignment);
    this.logger.log(`📅 Scheduled retry ${assignment.attemptCount + 1} for order ${assignment.order.id} in ${backoffMinutes} minutes`);
  }

  /**
   * Type guard to validate job data
   */
  private isValidJobData(data: unknown): data is FindShipperJobData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const job = data as any;
    return (
      typeof job.pendingAssignmentId === 'string' &&
      typeof job.orderId === 'string' &&
      typeof job.attempt === 'number'
    );
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===============================
  // EXISTING METHODS (kept for backward compatibility)
  // ===============================

  /**
   * Add a confirmed order to pending assignments
   */
  async addPendingAssignment(orderId: string, priority: number = 1): Promise<PendingShipperAssignment> {
    this.logger.log(`🚀 Adding pending assignment for order ${orderId} with priority ${priority}`);

    try {
      // Check if assignment already exists
      const existing = await this.pendingAssignmentRepository.findOne({
        where: { order: { id: orderId } }
      });

      if (existing) {
        this.logger.warn(`⚠️ Pending assignment already exists for order ${orderId}`);
        return existing;
      }

      // Validate order
      const order = await this.validateOrderForAssignment(orderId);

      // Create pending assignment
      const assignment = await this.createPendingAssignment(order, priority);

      this.logger.log(`✅ Created pending assignment ${assignment.id} for order ${orderId}`);
      
      return assignment;
    } catch (error) {
      this.logger.error(`❌ Failed to add pending assignment for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Validates that an order can be assigned to a shipper
   */
  private async validateOrderForAssignment(orderId: string): Promise<Order> {
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

    return order;
  }

  /**
   * Creates a pending assignment record in the database
   */
  private async createPendingAssignment(order: Order, priority: number): Promise<PendingShipperAssignment> {
    const pendingAssignment = this.pendingAssignmentRepository.create({
      order,
      priority,
      attemptCount: 0,
      nextAttemptAt: new Date(), // Try immediately
    });

    const saved = await this.pendingAssignmentRepository.save(pendingAssignment);
    this.logger.log(`✅ Saved pending assignment ${saved.id} for order ${order.id}`);

    return saved;
  }

  /**
   * Remove pending assignment when order is assigned
   */
  async removePendingAssignment(orderId: string): Promise<void> {
    this.logger.log(`🗑️ Removing pending assignment for order ${orderId}`);
    
    const result = await this.pendingAssignmentRepository.delete({
      order: { id: orderId }
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`✅ Removed pending assignment for order ${orderId}`);
    } else {
      this.logger.warn(`⚠️ No pending assignment found to remove for order ${orderId}`);
    }
  }

  /**
   * Cleanup old pending assignments
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredAssignments(): Promise<void> {
    this.logger.log('🧹 Running cleanup of expired pending assignments...');
    
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    const result = await this.pendingAssignmentRepository.delete({
      createdAt: LessThan(cutoffTime)
    });

    if (result.affected && result.affected > 0) {
      this.logger.log(`🗑️ Cleaned up ${result.affected} expired pending assignments`);
    } else {
      this.logger.log('✅ No expired pending assignments to clean up');
    }
  }

  /**
   * Get statistics about the pending assignment system
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async logSystemStats(): Promise<void> {
    try {
      const dbPendingCount = await this.pendingAssignmentRepository.count();
      const queueSize = await this.queueService.getQueueSize(QueueNames.FIND_SHIPPER);
      
      this.logger.log(`📊 System Stats: ${dbPendingCount} pending assignments in DB, ${queueSize} jobs in queue`);
      
      if (dbPendingCount > 0) {
        const readyToProcess = await this.pendingAssignmentRepository.count({
          where: { nextAttemptAt: LessThan(new Date()) }
        });
        this.logger.log(`⏰ ${readyToProcess} assignments ready for processing`);
      }
    } catch (error) {
      this.logger.error('❌ Error collecting system stats:', error);
    }
  }

  /**
   * Cleanup worker on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.workerId) {
      try {
        await this.boss.offWork(this.workerId);
        this.logger.log(`✅ Stopped worker ${this.workerId}`);
      } catch (error) {
        this.logger.error(`❌ Error stopping worker:`, error);
      }
    }
  }
}