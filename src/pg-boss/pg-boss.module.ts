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
        const boss = new PgBoss(connectionString);

        factoryLogger.log(`pg-boss instance created with connection string: ${connectionString}`);
        factoryLogger.log('pg-boss instance created successfully.');
        // Use the logger for pg-boss internal errors
        boss.on('error', error => factoryLogger.error(`pg-boss internal error: ${error.message}`, error.stack));

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
      await this.boss.createQueue(QueueNames.NOTIFY_SHIPPERS);
      
      this.logger.log('All queues created successfully.');
    } catch (error) {
      this.logger.error(`Failed to start pg-boss: ${error.message}`, error.stack);
      // Depending on the application's needs, you might want to re-throw or handle this differently
      throw error; // Re-throw to potentially stop application startup on failure
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
}