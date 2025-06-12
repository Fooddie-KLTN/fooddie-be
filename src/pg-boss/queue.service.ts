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
    this.logger.log(`Attempting to add job to queue '${queueName}'...`);
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

      this.logger.log(`Job added to queue '${queueName}' with ID: ${jobId}`);
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
}