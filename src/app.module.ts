/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { RoleModule } from './modules/role/role.module';
import { AuthModule } from './auth/auth.module';
import { DataSource } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { Review } from './entities/review.entity';
import { ReviewModule } from './modules/review/review.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { AddressModule } from './modules/address/address.module';
import { Address } from './entities/address.entity';
import { Promotion } from './entities/promotion.entity';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { FoodModule } from './modules/food/food.module';
import { OrderModule } from './modules/order/order.module';
import { CategoryModule } from './modules/category/category.module';
import { Permission } from './entities/permission.entity';
import { ChatModule } from './modules/chat/chat.module';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ShipperModule } from './modules/shipper/shipper.module';
import { QueueModule } from './pg-boss/queue.module';
import { PgBossModule } from './pg-boss/pg-boss.module'; // Add this import

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true, // Cache config
    }),
    // Database connection
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: +(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        synchronize: false,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        migrationsTableName: 'migrations',
        autoLoadEntities: true,
        // Memory optimizations
        keepConnectionAlive: false,
        retryAttempts: 1,
        retryDelay: 1000,
        maxQueryExecutionTime: 5000,
        poolSize: 3, // Reduce connection pool
        extra: {
          max: 3, // Maximum pool size
          min: 1, // Minimum pool size
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
    
    // Core modules only
    PgBossModule, // Add this line
    ChatModule,
    UsersModule,
    RoleModule,
    AuthModule,
    ReviewModule,
    PromotionModule,
    AddressModule,
    RestaurantModule,
    FoodModule,
    OrderModule,
    CategoryModule,
    ShipperModule,
    
    QueueModule,
    ScheduleModule.forRoot(),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      subscriptions: {
        'graphql-ws': {
          onConnect: () => console.log('GraphQL WS connected'),
          onDisconnect: () => console.log('GraphQL WS disconnected'),
        }
      },
      context: ({ req, connectionParams }) => {
        if (req) return { req };
        if (connectionParams?.Authorization) {
          return { token: connectionParams.Authorization };
        }
        return {};
      },
      // Memory optimizations
      introspection: process.env.NODE_ENV !== 'production',
      playground: false, // Disable in production
      debug: false,
      formatError: (error) => ({
        message: error.message,
        path: error.path,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {
  constructor(private readonly dataSource: DataSource) {
    console.log('AppModule.constructor()');
  }
}
