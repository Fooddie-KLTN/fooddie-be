import { Module, Global, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as PgBoss from 'pg-boss';
import { QueueNames } from './queue.constants';

export const PG_BOSS_INSTANCE = 'PG_BOSS_INSTANCE';

/**
 * Provides and manages the pg-boss instance for background job queuing.
 */
@Global() // Make PgBoss available globally
@Module({
  imports: [ConfigModule], // Ensure ConfigModule is imported if you use ConfigService
  providers: [
    {
      provide: PG_BOSS_INSTANCE,
      useFactory: async (configService: ConfigService): Promise<PgBoss> => {
        // Use a temporary logger instance for the factory, as 'this' is not available
        const factoryLogger = new Logger('PgBossModuleFactory');

        const dbUser = configService.get<string>('DB_USERNAME');
        const dbPassword = configService.get<string>('DB_PASSWORD');
        const dbHost = configService.get<string>('DB_HOST');
        const dbPort = configService.get<number>('DB_PORT');
        const dbName = configService.get<string>('DB_NAME');

        if (!dbUser || !dbPassword || !dbHost || !dbPort || !dbName) {
          factoryLogger.error('Database configuration environment variables (DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME) are missing for pg-boss.');
          // Throwing an error here will prevent the application from starting, which is appropriate
          throw new Error('Missing database configuration for pg-boss.');
        }

        const connectionString = `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
        const boss = new PgBoss({
          connectionString,
          retryLimit: 3,
          retryDelay: 5000,
          expireInHours: 2,
          // Add monitoring options
          monitorStateIntervalSeconds: 10,
          maintenanceIntervalSeconds: 120,
        });

        factoryLogger.log(`pg-boss instance created with connection string: ${connectionString}`);
        factoryLogger.log('pg-boss instance created successfully.');
        
        // Use the logger for pg-boss internal errors
        boss.on('error', error => factoryLogger.error(`pg-boss internal error: ${error.message}`, error.stack));
        
        // Add job monitoring events
        boss.on('monitor-states', states => {
          factoryLogger.log(`📊 PG-Boss Queue States: ${JSON.stringify(states)}`);
        });

        return boss;
      },
      inject: [ConfigService],
    },
  ],
  exports: [PG_BOSS_INSTANCE],
})
export class PgBossModule implements OnModuleInit, OnModuleDestroy {
  // Instantiate Logger for the module instance
  private readonly logger = new Logger(PgBossModule.name);

  constructor(@Inject(PG_BOSS_INSTANCE) private readonly boss: PgBoss) {}

  /**
   * Starts the pg-boss instance when the module initializes.
   */
  async onModuleInit(): Promise<void> {
    try {
      const result = await this.boss.start();
      this.logger.log(`pg-boss started successfully: ${JSON.stringify(result)}`);
      this.logger.log('pg-boss started successfully.');

      // Create all required queues
      await this.boss.createQueue(QueueNames.FIND_SHIPPER);
      
      this.logger.log('All queues created successfully.');

      // Start monitoring jobs every 30 seconds
      this.startJobMonitoring();
      
    } catch (error) {
      this.logger.error(`Failed to start pg-boss: ${error.message}`, error.stack);
      // Depending on the application's needs, you might want to re-throw or handle this differently
      throw error; // Re-throw to potentially stop application startup on failure
    }
  }

  /**
   * Monitor pending jobs periodically
   */
  private startJobMonitoring(): void {
    setInterval(async () => {
      try {
        await this.logQueueStats();
      } catch (error) {
        this.logger.error('Error monitoring queue stats:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Log current queue statistics
   */
  private async logQueueStats(): Promise<void> {
    try {
      // Get queue stats for all our queues
      for (const queueName of Object.values(QueueNames)) {
        const jobs = await this.boss.fetch(queueName); // Fix: use options object
        
        if (jobs && jobs.length > 0) {
          this.logger.log(`📋 Queue '${queueName}' has ${jobs.length} pending jobs:`);
          
          jobs.forEach((job, index) => {
            this.logger.log(`  ${index + 1}. Job ID: ${job.id}, Data: ${JSON.stringify(job.data)}`);
          });
        } else {
          this.logger.log(`✅ Queue '${queueName}' is empty`);
        }
      }

      // Get overall queue health
      const queueSize = await this.boss.getQueueSize(QueueNames.FIND_SHIPPER);
      this.logger.log(`📊 ${QueueNames.FIND_SHIPPER} queue size: ${queueSize}`);

    } catch (error) {
      this.logger.error('Error fetching queue stats:', error);
    }
  }

  /**
   * Stops the pg-boss instance when the application shuts down.
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.boss.stop();
      this.logger.log('pg-boss stopped successfully.');
    } catch (error) {
      this.logger.error(`Failed to stop pg-boss gracefully: ${error.message}`, error.stack);
    }
  }

  /**
   * Get current queue statistics (for external monitoring)
   */
  async getQueueStats(): Promise<any> {
    const stats = {};
    
    for (const queueName of Object.values(QueueNames)) {
      try {
        const size = await this.boss.getQueueSize(queueName);
        const jobs = await this.boss.fetch(queueName, { batchSize: 10 }); // Fix: use options object
        
        stats[queueName] = {
          size,
          pendingJobs: jobs?.map(job => ({
            id: job.id,
            data: job.data,
          })) || []
        };
      } catch (error) {
        this.logger.error(`Error getting stats for queue ${queueName}:`, error);
        stats[queueName] = { error: error.message };
      }
    }
    
    return stats;
  }
}