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
import { haversineDistance } from 'src/common/utils/helper';
import { activeShipperTracker } from 'src/modules/order/order.resolver'; // Import the tracker

// Import the active shipper tracker
interface ActiveShipper {
    shipperId: string;
    latitude: number;
    longitude: number;
    maxDistance: number;
    lastSeen: Date;
}

// Simple tracker service (you could also inject the resolver's tracker)
class ShipperNotificationTracker {
    private notifiedShippers: Map<string, Set<string>> = new Map(); // orderId -> Set of shipperIds
    private shipperResponseTimeout: Map<string, NodeJS.Timeout> = new Map(); // orderId -> timeout

    addNotifiedShipper(orderId: string, shipperId: string): void {
        if (!this.notifiedShippers.has(orderId)) {
            this.notifiedShippers.set(orderId, new Set());
        }
        this.notifiedShippers.get(orderId)!.add(shipperId);
    }

    hasBeenNotified(orderId: string, shipperId: string): boolean {
        return this.notifiedShippers.get(orderId)?.has(shipperId) || false;
    }

    clearOrder(orderId: string): void {
        this.notifiedShippers.delete(orderId);
        const timeout = this.shipperResponseTimeout.get(orderId);
        if (timeout) {
            clearTimeout(timeout);
            this.shipperResponseTimeout.delete(orderId);
        }
    }

    setResponseTimeout(orderId: string, callback: () => void, timeoutMs: number): void {
        const timeout = setTimeout(callback, timeoutMs);
        this.shipperResponseTimeout.set(orderId, timeout);
    }

    getNotifiedShippers(orderId: string): string[] {
        return Array.from(this.notifiedShippers.get(orderId) || []);
    }
}

@Injectable()
export class PendingAssignmentService implements OnModuleInit {
    private readonly logger = new Logger(PendingAssignmentService.name);
    private workerId: string | null = null;
    private shipperTracker = new ShipperNotificationTracker();

    constructor(
        @InjectRepository(PendingShipperAssignment)
        private pendingAssignmentRepository: Repository<PendingShipperAssignment>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        private queueService: QueueService,
        @Inject(PG_BOSS_INSTANCE) private readonly boss: PgBoss,
    ) {
        // this.logger.log('🏗️ PendingAssignmentService constructor called');
    }

    /**
     * Initialize the worker when the module starts
     */
    async onModuleInit(): Promise<void> {
        // this.logger.log(`📝 PendingAssignmentService onModuleInit called!`);
        // this.logger.log(`📝 Registering worker for queue: ${QueueNames.FIND_SHIPPER}`);
        
        // Give pg-boss time to fully initialize
        setTimeout(async () => {
            try {
                // this.logger.log(`🚀 Starting worker registration after delay...`);
                
                // Worker options following pg-boss documentation
                const workerOptions = {
                    batchSize: 1,
                    pollingIntervalSeconds: 1,
                    includeMetadata: false,
                    priority: true
                };

                // this.logger.log(`⚙️ Worker options: ${JSON.stringify(workerOptions)}`);

                // Register worker with correct handler signature
                this.workerId = await this.boss.work(
                    QueueNames.FIND_SHIPPER,
                    workerOptions,
                    this.handleFindShipperJobs.bind(this)
                );
                
                // this.logger.log(`✅ Worker for ${QueueNames.FIND_SHIPPER} registered successfully with ID: ${this.workerId}`);
                
                // Perform initial check for existing pending assignments
                setTimeout(async () => {
                    // this.logger.log(`🔍 Performing initial check for pending assignments...`);
                    await this.checkPendingAssignmentsAndCreateJobs();
                }, 2000);
                
            } catch (error) {
                this.logger.error(`❌ Failed to register worker for ${QueueNames.FIND_SHIPPER}: ${error.message}`, error.stack);
            }
        }, 3000);

        // this.logger.log(`📝 PendingAssignmentService onModuleInit completed setup`);
    }

    /**
     * Daily check for pending assignments in database and create jobs for them
     * This is the main method that acts as a daily database check
     */
    @Cron(CronExpression.EVERY_10_SECONDS) // Also check every 10 minutes for testing
    async checkPendingAssignmentsAndCreateJobs(): Promise<void> {
        // this.logger.log('🔍 === DAILY CHECK: Scanning database for pending shipper assignments ===');
        
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

            // this.logger.log(`📊 Found ${pendingAssignments.length} pending assignments in database`);

            if (pendingAssignments.length === 0) {
                // this.logger.log('✅ No pending assignments found in database');
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
                        // this.logger.log(`✅ Created job ${jobId} for pending assignment ${assignment.id}`);
                    }

                } catch (error) {
                    this.logger.error(`❌ Error processing pending assignment ${assignment.id}:`, error);
                }
            }

            // this.logger.log(`🎯 Daily check completed: ${jobsCreated} jobs created, ${assignmentsRemoved} invalid assignments removed`);

        } catch (error) {
            this.logger.error('❌ Error during daily pending assignments check:', error);
        }
    }

    /**
     * Get expired pending assignments based on their creation time
     */
    async getExpiredAssignments(cutoffDate: Date): Promise<PendingShipperAssignment[]> {
        // this.logger.log(`🔍 Looking for pending assignments created before ${cutoffDate.toISOString()}`);
        
        const expiredAssignments = await this.pendingAssignmentRepository.find({
            where: {
                createdAt: LessThan(cutoffDate)
            },
            relations: ['order', 'order.restaurant', 'order.shippingDetail'],
            order: {
                createdAt: 'ASC' // Oldest first
            }
        });

        // this.logger.log(`📊 Found ${expiredAssignments.length} expired pending assignments`);
        
        return expiredAssignments;
    }


    /**
     * Remove a pending assignment by assignment ID
     */
    async removePendingAssignmentById(assignmentId: string): Promise<boolean> {
        try {
            const assignment = await this.pendingAssignmentRepository.findOne({
                where: { id: assignmentId }
            });

            if (assignment) {
                await this.pendingAssignmentRepository.remove(assignment);
                // this.logger.log(`🗑️ Removed pending assignment ${assignmentId}`);
                return true;
            } else {
                // this.logger.log(`⚠️ Pending assignment ${assignmentId} not found`);
                return false;
            }
        } catch (error) {
            this.logger.error(`❌ Failed to remove pending assignment ${assignmentId}:`, error);
            return false;
        }
    }

    /**
     * Validate if a pending assignment is still valid for processing
     */
    private async validatePendingAssignment(assignment: PendingShipperAssignment): Promise<boolean> {
        const order = assignment.order;

        // Check if order still exists and is in confirmed status
        if (!order || order.status !== 'confirmed') {
            // this.logger.log(`❌ Assignment ${assignment.id}: Order ${order?.id} is not confirmed (status: ${order?.status})`);
            return false;
        }

        // Check if order is already assigned to a shipper
        if (order.shippingDetail) {
            // this.logger.log(`❌ Assignment ${assignment.id}: Order ${order.id} already assigned to shipper`);
            return false;
        }


        if (assignment.isSentToShipper == true)
        {
            // this.logger.log(`❌ Assignment ${assignment.id}: Already sent to shipper, skipping`);
            return false;
        }

        // Check if assignment has exceeded maximum attempts or age based on assignment creation time
        const maxAttempts = 15;
        const maxAgeMinutes = 30; // 30 minutes from assignment creation
        const maxAge = maxAgeMinutes * 60 * 1000;
        const assignmentAge = Date.now() - assignment.createdAt.getTime();
        const isExpired = assignmentAge > maxAge;

        if (assignment.attemptCount >= maxAttempts || isExpired) {
            const ageMinutes = Math.round(assignmentAge / (1000 * 60));
            // this.logger.log(`❌ Assignment ${assignment.id}: Exceeded max attempts (${assignment.attemptCount}) or expired (${ageMinutes} minutes old)`);
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

            // this.logger.log(`📤 Queued job ${jobId} for assignment ${assignment.id}, order ${assignment.order.id}`);
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
        // this.logger.log(`🔥 Processing ${jobs.length} shipper assignment jobs`);
        
        if (!jobs || jobs.length === 0) {
            // this.logger.warn('⚠️ Received empty jobs array');
            return;
        }

        for (const job of jobs) {
            if (!job) {
                // this.logger.warn('⚠️ Received null/undefined job in batch');
                continue;
            }

            // this.logger.log(`📨 Processing job ${job.id} for finding nearest shipper`);

            try {
                await this.processShipperAssignmentJob(job);
                // this.logger.log(`✅ Successfully processed job ${job.id}`);
            } catch (error) {
                this.logger.error(`❌ Error processing job ${job.id}: ${error.message}`, error.stack);
                throw error;
            }
        }
    }

    /**
     * Process a single shipper assignment job - find and notify ONE nearest shipper
     */
    private async processShipperAssignmentJob(job: PgBoss.Job<FindShipperJobData>): Promise<void> {
        if (!job?.data || !this.isValidJobData(job.data)) {
            this.logger.error(`❌ Received invalid job data: ${JSON.stringify(job)}`);
            throw new Error('Invalid job data');
        }

        const { pendingAssignmentId, orderId, attempt } = job.data;
        
        // this.logger.log(`🎯 === PROCESSING SHIPPER ASSIGNMENT FOR ORDER ${orderId} ===`);
        // this.logger.log(`🔄 Job ID: ${job.id}, Assignment ID: ${pendingAssignmentId}, Attempt: ${attempt}`);

        try {
            // Get the pending assignment and order details
            const assignment = await this.pendingAssignmentRepository.findOne({
                where: { id: pendingAssignmentId },
                relations: ['order', 'order.restaurant', 'order.user', 'order.address', 'order.orderDetails', 'order.orderDetails.food']
            });

            if (!assignment) {
                // this.logger.warn(`⚠️ Pending assignment ${pendingAssignmentId} not found`);
                return;
            }

            const order = assignment.order;

            // Validate order is still assignable
            if (order.status !== 'confirmed') {
                // this.logger.log(`❌ Order ${orderId} status changed to ${order.status}, removing assignment`);
                await this.pendingAssignmentRepository.remove(assignment);
                this.shipperTracker.clearOrder(orderId);
                return;
            }

            // Check if already assigned
            const currentOrder = await this.orderRepository.findOne({
                where: { id: orderId },
                relations: ['shippingDetail']
            });

            if (currentOrder?.shippingDetail) {
                // this.logger.log(`✅ Order ${orderId} already assigned, removing from pending`);
                await this.pendingAssignmentRepository.remove(assignment);
                this.shipperTracker.clearOrder(orderId);
                return;
            }

            // Find the nearest available shipper
            const nearestShipper = await this.findNearestAvailableShipper(order);
            
            if (!nearestShipper) {
                // this.logger.log(`😞 No available shippers found for order ${orderId}, scheduling retry...`);
                await this.scheduleRetryForAssignment(assignment);
                return;
            }

            // Notify ONLY this one shipper
            // this.logger.log(`📡 Notifying shipper ${nearestShipper.shipperId} about order ${orderId}...`);
            
            await pubSub.publish('orderConfirmedForShippers', {
                orderConfirmedForShippers: order,
                targetShipperId: nearestShipper.shipperId
            });

            assignment.isSentToShipper = true;

            await this.pendingAssignmentRepository.save(assignment);

            // Track that this shipper was notified
            this.shipperTracker.addNotifiedShipper(orderId, nearestShipper.shipperId);
            
            // this.logger.log(`✅ Notified shipper ${nearestShipper.shipperId} about order ${orderId}`);

            // Set timeout for shipper response (e.g., 2 minutes)
            this.shipperTracker.setResponseTimeout(orderId, async () => {
                // this.logger.log(`⏰ Shipper ${nearestShipper.shipperId} didn't respond to order ${orderId}, trying next shipper...`);
                
                try {
                    // Fetch the latest assignment data to avoid stale entity issues
                    const latestAssignment = await this.pendingAssignmentRepository.findOne({
                        where: { id: assignment.id },
                        relations: ['order']
                    });
                    
                    if (!latestAssignment) {
                        // this.logger.warn(`⚠️ Assignment ${assignment.id} not found for retry`);
                        return;
                    }
                    
                    // Update the assignment to mark it as not sent to shipper
                    latestAssignment.isSentToShipper = false;
                    await this.pendingAssignmentRepository.save(latestAssignment);
                    
                    // Schedule retry with the fresh assignment data
                    await this.scheduleRetryForAssignment(latestAssignment);
                    
                } catch (error) {
                    this.logger.error(`❌ Error handling shipper timeout for assignment ${assignment.id}:`, error);
                    
                    // If there's an error, try to clean up by removing the assignment
                    try {
                        const assignmentToRemove = await this.pendingAssignmentRepository.findOne({
                            where: { id: assignment.id }
                        });
                        if (assignmentToRemove) {
                            await this.pendingAssignmentRepository.remove(assignmentToRemove);
                            // this.logger.log(`🗑️ Removed problematic assignment ${assignment.id} after timeout error`);
                        }
                    } catch (cleanupError) {
                        this.logger.error(`💥 Failed to cleanup assignment ${assignment.id}:`, cleanupError);
                    }
                }
            }, 2 * 60 * 1000); // 2 minutes

            // this.logger.log(`🎯 === COMPLETED PROCESSING FOR ORDER ${orderId} ===`);

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
     * Find the nearest available shipper for an order using the resolver's tracker
     */
    private async findNearestAvailableShipper(order: Order): Promise<ActiveShipper | null> {
        if (!order.restaurant?.latitude || !order.restaurant?.longitude) {
            // this.logger.warn(`❌ Order ${order.id} restaurant has no coordinates`);
            return null;
        }

        const restaurantLat = parseFloat(order.restaurant.latitude.toString());
        const restaurantLng = parseFloat(order.restaurant.longitude.toString());
        const alreadyNotified = this.shipperTracker.getNotifiedShippers(order.id);

        let nearestShipper: ActiveShipper | null = null;
        let shortestDistance = Infinity;

        // Get active shippers from the resolver's tracker - THIS IS THE FIX!
        const activeShippers = activeShipperTracker.getAllShippers();
        // this.logger.log(`📋 Found ${activeShippers.length} active shippers from resolver tracker`);

        // Debug: Log all active shippers
        // activeShippers.forEach(shipper => {
        //     this.logger.log(`👤 Active shipper: ${shipper.shipperId} at lat=${shipper.latitude}, lng=${shipper.longitude}, maxDistance=${shipper.maxDistance}`);
        // });

        for (const shipper of activeShippers) {
            // Skip shippers already notified about this order
            if (alreadyNotified.includes(shipper.shipperId)) {
                // this.logger.log(`⏭️ Skipping shipper ${shipper.shipperId} - already notified`);
                continue;
            }

            const distance = haversineDistance(
                shipper.latitude,
                shipper.longitude,
                restaurantLat,
                restaurantLng
            );

            // this.logger.log(`📏 Shipper ${shipper.shipperId} distance: ${distance}km (max: ${shipper.maxDistance}km)`);

            if (distance <= shipper.maxDistance && distance < shortestDistance) {
                shortestDistance = distance;
                nearestShipper = shipper;
            }
        }

        if (nearestShipper) {
            // this.logger.log(`🎯 Selected shipper ${nearestShipper.shipperId} at ${shortestDistance}km distance`);
        } else {
            // this.logger.log(`😞 No suitable shippers found for order ${order.id}`);
        }

        return nearestShipper;
    }

    /**
     * Clean up notification tracking when order is assigned
     */
    async onOrderAssigned(orderId: string): Promise<void> {
        this.shipperTracker.clearOrder(orderId);
        // this.logger.log(`🎉 Order ${orderId} assigned, cleared notification tracking`);
    }

    /**
     * Schedule a retry for a failed assignment attempt
     */
    private async scheduleRetryForAssignment(assignment: PendingShipperAssignment): Promise<void> {
        const maxRetries = 10;
        const baseDelay = 1; // 1 minute base delay
        
        if (assignment.attemptCount >= maxRetries) {
            // this.logger.warn(`🚫 Max retries (${maxRetries}) reached for assignment ${assignment.id}, removing from queue`);
            
            try {
                await this.pendingAssignmentRepository.remove(assignment);
                // this.logger.log(`🗑️ Removed assignment ${assignment.id} after max retries`);
            } catch (error) {
                this.logger.error(`❌ Failed to remove assignment ${assignment.id}:`, error);
            }
            
            return;
        }

        // Calculate exponential backoff delay
        const delayMinutes = Math.min(baseDelay * Math.pow(2, assignment.attemptCount), 60); // Max 60 minutes
        const nextAttempt = new Date(Date.now() + delayMinutes * 60 * 1000);

        try {
            // Fetch the latest assignment to avoid working with stale data
            const latestAssignment = await this.pendingAssignmentRepository.findOne({
                where: { id: assignment.id },
                relations: ['order']
            });

            if (!latestAssignment) {
                // this.logger.warn(`⚠️ Assignment ${assignment.id} not found for retry scheduling`);
                return;
            }

            // Update the existing assignment instead of creating a new one
            latestAssignment.attemptCount += 1;
            latestAssignment.lastAttemptAt = new Date();
            latestAssignment.nextAttemptAt = nextAttempt;
            latestAssignment.isSentToShipper = false; // Reset the flag for retry

            await this.pendingAssignmentRepository.save(latestAssignment);
            
            // this.logger.log(`🔄 Scheduled retry ${latestAssignment.attemptCount}/${maxRetries} for assignment ${assignment.id} in ${delayMinutes} minutes (next attempt: ${nextAttempt.toISOString()})`);
            
        } catch (error) {
            this.logger.error(`❌ Failed to schedule retry for assignment ${assignment.id}:`, error);
            
            // If updating fails, try to remove the assignment to prevent further errors
            try {
                const assignmentToRemove = await this.pendingAssignmentRepository.findOne({
                    where: { id: assignment.id }
                });
                if (assignmentToRemove) {
                    await this.pendingAssignmentRepository.remove(assignmentToRemove);
                    // this.logger.log(`🗑️ Removed problematic assignment ${assignment.id}`);
                }
            } catch (removeError) {
                this.logger.error(`💥 Failed to remove problematic assignment ${assignment.id}:`, removeError);
            }
        }
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
        // this.logger.log(`🚀 Adding pending assignment for order ${orderId} with priority ${priority}`);

        try {
            // Check if assignment already exists
            const existing = await this.pendingAssignmentRepository.findOne({
                where: { order: { id: orderId } }
            });

            if (existing) {
                // this.logger.warn(`⚠️ Pending assignment already exists for order ${orderId}`);
                return existing;
            }

            // Validate order
            const order = await this.validateOrderForAssignment(orderId);

            // Create pending assignment
            const assignment = await this.createPendingAssignment(order, priority);

            // this.logger.log(`✅ Created pending assignment ${assignment.id} for order ${orderId}`);
            
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
            isSentToShipper: false,
        });

        const saved = await this.pendingAssignmentRepository.save(pendingAssignment);
        // this.logger.log(`✅ Saved pending assignment ${saved.id} for order ${order.id}`);

        return saved;
    }

    /**
     * Remove pending assignment when order is assigned
     */
    async removePendingAssignment(orderId: string): Promise<void> {
        // this.logger.log(`🗑️ Removing pending assignment for order ${orderId}`);
        
        const result = await this.pendingAssignmentRepository.delete({
            order: { id: orderId }
        });

        if (result.affected && result.affected > 0) {
            // this.logger.log(`✅ Removed pending assignment for order ${orderId}`);
        } else {
            // this.logger.warn(`⚠️ No pending assignment found to remove for order ${orderId}`);
        }
    }

    /**
     * Cleanup old pending assignments
     */
    @Cron(CronExpression.EVERY_HOUR)
    async cleanupExpiredAssignments(): Promise<void> {
        // this.logger.log('🧹 Running cleanup of expired pending assignments...');
        
        const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

        const result = await this.pendingAssignmentRepository.delete({
            createdAt: LessThan(cutoffTime)
        });

        if (result.affected && result.affected > 0) {
            // this.logger.log(`🗑️ Cleaned up ${result.affected} expired pending assignments`);
        } else {
            // this.logger.log('✅ No expired pending assignments to clean up');
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
            
            // this.logger.log(`📊 System Stats: ${dbPendingCount} pending assignments in DB, ${queueSize} jobs in queue`);
            
            if (dbPendingCount > 0) {
                const readyToProcess = await this.pendingAssignmentRepository.count({
                    where: { nextAttemptAt: LessThan(new Date()) }
                });
                // this.logger.log(`⏰ ${readyToProcess} assignments ready for processing`);
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
                // this.logger.log(`✅ Stopped worker ${this.workerId}`);
            } catch (error) {
                this.logger.error(`❌ Error stopping worker:`, error);
            }
        }
    }
}