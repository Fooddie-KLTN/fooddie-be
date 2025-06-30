import { Injectable, Logger, Inject, InternalServerErrorException } from '@nestjs/common';
import * as PgBoss from 'pg-boss';
import { PG_BOSS_INSTANCE } from '../pg-boss/pg-boss.module';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@Inject(PG_BOSS_INSTANCE) private readonly boss: PgBoss) {
    this.logger.log('QueueService initialized with pg-boss');
  }

  /**
   * Adds a job to the specified pg-boss queue.
   * @param queueName The name of the queue (e.g., from QueueNames).
   * @param jobData The data for the job.
   * @param options Optional pg-boss job options (e.g., retryLimit, expireIn).
   * @returns The ID of the created job.
   * @throws InternalServerErrorException if queuing fails.
   */
  async addJob<T extends object>(
    queueName: string,
    jobData: T,
    options?: PgBoss.SendOptions,
  ): Promise<string> {
    //this.logger.log(`Attempting to add job to queue '${queueName}'...`);
    try {
      // pg-boss send() should throw an error on failure, but we check jobId just in case.
      const jobId: string | null = await this.boss.send(queueName, jobData, options || {});
      if (!jobId) {
        // This case indicates an unexpected issue where send completed without error but returned no ID.
        this.logger.error(
          `pg-boss.send returned null for queue '${queueName}'. This indicates a potential issue with pg-boss or the DB connection.`,
        );
        throw new InternalServerErrorException(`Failed to obtain job ID from pg-boss for queue '${queueName}'.`);
      }

      //this.logger.log(`Job added to queue '${queueName}' with ID: ${jobId}`);
      return jobId;
    } catch (error) {

      // Log the original error from pg-boss for detailed debugging.
      this.logger.error(
        `Failed to add job to queue '${queueName}': ${error.message}`,
        error.stack, // Include stack trace for better context
      );

      // Throw a NestJS standard exception for consistency in error handling.
      throw new InternalServerErrorException(`Failed to add job to queue '${queueName}': ${error.message}`);
    }
  }

  /**
   * Gets the number of jobs in a queue.
   * @param queueName The name of the queue.
   * @returns The number of jobs in the queue.
   */
  async getQueueSize(queueName: string): Promise<number> {
    try {
      //this.logger.debug(`Getting queue size for '${queueName}'...`);
      const size = await this.boss.getQueueSize(queueName);
      //this.logger.debug(`Queue '${queueName}' has ${size} jobs`);
      return size;
    } catch (error) {
      //this.logger.error(`Failed to get queue size for '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get queue size for '${queueName}': ${error.message}`);
    }
  }

  /**
   * Gets pending jobs from a queue.
   * @param queueName The name of the queue.
   * @param limit Maximum number of jobs to fetch.
   * @returns Array of pending jobs.
   */
  async getPendingJobs(queueName: string, limit: number = 10): Promise<PgBoss.Job<any>[]> {
    try {
     // this.logger.log(`Fetching up to ${limit} pending jobs from queue '${queueName}'...`);
      
      const jobs = await this.boss.fetch(queueName);
      
      if (jobs && jobs.length > 0) {
        //this.logger.log(`📋 Found ${jobs.length} pending jobs in queue '${queueName}':`);
        jobs.forEach((job, index) => {
          this.logger.log(`  ${index + 1}. Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);
        });
      } else {
       // this.logger.log(`✅ No pending jobs found in queue '${queueName}'`);
      }
      
      return jobs || [];
    } catch (error) {
      this.logger.error(`Failed to fetch pending jobs from '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to fetch pending jobs from '${queueName}': ${error.message}`);
    }
  }

  /**
   * Gets detailed statistics for a queue.
   * @param queueName The name of the queue.
   * @returns Queue statistics.
   */
  async getQueueStats(queueName: string): Promise<{
    size: number;
    pendingJobs: Array<{ id: string; data: any; }>;
  }> {
    try {
      //this.logger.debug(`Getting detailed stats for queue '${queueName}'...`);
      
      const [size, jobs] = await Promise.all([
        this.getQueueSize(queueName),
        this.getPendingJobs(queueName, 5) // Get up to 5 jobs for stats
      ]);

      const stats = {
        size,
        pendingJobs: jobs.map(job => ({
          id: job.id,
          data: job.data,
        }))
      };

     // this.logger.debug(`Stats for queue '${queueName}': ${JSON.stringify(stats, null, 2)}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get queue stats for '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to get queue stats for '${queueName}': ${error.message}`);
    }
  }

  /**
   * Cancels a job by ID.
   * @param queueName The name of the queue.
   * @param jobId The ID of the job to cancel.
   * @returns True if the job was cancelled successfully.
   */
  async cancelJob(queueName: string, jobId: string): Promise<boolean> {
    try {
      //this.logger.log(`Attempting to cancel job ${jobId} in queue '${queueName}'...`);
      await this.boss.cancel(queueName, jobId);
     // this.logger.log(`Job ${jobId} cancelled successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel job ${jobId} in queue '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to cancel job ${jobId} in queue '${queueName}': ${error.message}`);
    }
  }

  /**
   * Completes a job by ID.
   * @param queueName The name of the queue.
   * @param jobId The ID of the job to complete.
   * @returns True if the job was completed successfully.
   */
  async completeJob(queueName: string, jobId: string): Promise<boolean> {
    try {
     // this.logger.log(`Attempting to complete job ${jobId} in queue '${queueName}'...`);
      await this.boss.complete(queueName, jobId);
      //this.logger.log(`Job ${jobId} completed successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to complete job ${jobId} in queue '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to complete job ${jobId} in queue '${queueName}': ${error.message}`);
    }
  }

  /**
   * Fails a job by ID with an optional error message.
   * @param queueName The name of the queue.
   * @param jobId The ID of the job to fail.
   * @param errorMessage Optional error message.
   * @returns True if the job was failed successfully.
   */
  async failJob(queueName: string, jobId: string, errorMessage?: string): Promise<boolean> {
    try {
      this.logger.log(`Attempting to fail job ${jobId} in queue '${queueName}'...`);
      await this.boss.fail(queueName, jobId);
      this.logger.log(`Job ${jobId} failed successfully. Reason: ${errorMessage || 'No reason provided'}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to fail job ${jobId} in queue '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to fail job ${jobId} in queue '${queueName}': ${error.message}`);
    }
  }

  /**
   * Archives completed jobs older than the specified age.
   * @param queueName The name of the queue.
   * @param olderThanHours How many hours old completed jobs should be before archiving.
   * @returns Number of jobs archived.
   */
  async archiveCompletedJobs(queueName: string, olderThanHours: number = 24): Promise<number> {
    try {
      this.logger.log(`Attempting to archive completed jobs in queue '${queueName}' older than ${olderThanHours} hours...`);
      const result = await this.boss.archive();
      this.logger.log(`Archived ${result} completed jobs from queue '${queueName}'`);
      return 0;
    } catch (error) {
      this.logger.error(`Failed to archive completed jobs in queue '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to archive completed jobs in queue '${queueName}': ${error.message}`);
    }
  }

  /**
   * Purges archived jobs from the database.
   * @param queueName The name of the queue.
   * @param olderThanDays How many days old archived jobs should be before purging.
   * @returns Number of jobs purged.
   */
  async purgeArchivedJobs(queueName: string, olderThanDays: number = 7): Promise<number> {
    try {
      this.logger.log(`Attempting to purge archived jobs in queue '${queueName}' older than ${olderThanDays} days...`);
      const result = await this.boss.purge();
      this.logger.log(`Purged ${result} archived jobs from queue '${queueName}'`);
      return  0;
    } catch (error) {
      this.logger.error(`Failed to purge archived jobs in queue '${queueName}': ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to purge archived jobs in queue '${queueName}': ${error.message}`);
    }
  }

  /**
   * Gets the health status of the queue system.
   * @returns Health status information.
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
  }> {
    try {
      this.logger.debug('Getting queue system health status...');
      
      // Get basic health information
      const health = await this.boss.schemaVersion();
      
      const status = {
        isHealthy: true,
      };

      this.logger.debug(`Queue health status: ${JSON.stringify(status)}`);
      return status;
    } catch (error) {
      this.logger.error(`Failed to get queue health status: ${error.message}`, error.stack);
      return {
        isHealthy: false,
      };
    }
  }
}