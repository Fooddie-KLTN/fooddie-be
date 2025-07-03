import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShipperPerformanceTracking1750000000018 implements MigrationInterface {
    name = 'AddShipperPerformanceTracking1750000000018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "averageRating" float NOT NULL DEFAULT 5.0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "totalRatings" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "averageDeliveryTime" float NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "onTimeDeliveries" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lateDeliveries" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "totalEarnings" float NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastActiveAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "rejectedOrders" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "responseTimeMinutes" float NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "monthlyEarnings" float NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "weeklyEarnings" float NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "dailyEarnings" float NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "responseTimeMinutes"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "rejectedOrders"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastActiveAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "totalEarnings"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lateDeliveries"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "onTimeDeliveries"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "averageDeliveryTime"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "totalRatings"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "averageRating"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "weeklyEarnings"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "monthlyEarnings"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "totalEarnings"`);
    }
}