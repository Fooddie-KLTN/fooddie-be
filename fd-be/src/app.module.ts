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
import { AdminSeedService } from './migrations/admin-seeder.service';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
@Module({
  imports: [
    // Import the module that contains the user entity
    // and the user service
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres', // hoặc 'mysql', 'sqlite', ...
      host: process.env.DB_HOST ,
      port: +(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ,
      password: process.env.DB_PASSWORD ,
      database: process.env.DB_NAME ,
      //entities: [__dirname + '/**/*.entity{.ts,.js}'],
      entities: [__dirname + '/entities/*.entity{.ts,.js}'],
      synchronize: true, // Không dùng synchronize trong production, thay vào đó dùng migrations
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      autoLoadEntities: true,
    }),
    UsersModule,
    RoleModule,
    AuthModule,
    TypeOrmModule.forFeature([Role, User]),

  ],
  controllers: [AppController],
  providers: [AppService, AdminSeedService],
})
export class AppModule {
  constructor(private readonly dataSource: DataSource) {
    console.log('AppModule.constructor()');
  }
}
