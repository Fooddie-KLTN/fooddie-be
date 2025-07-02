import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShipperPerformanceFields1750000000012 implements MigrationInterface {
    name = 'AddShipperPerformanceFields1750000000012'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "completedDeliveries" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "failedDeliveries" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "users" ADD "activeDeliveries" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "activeDeliveries"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failedDeliveries"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "completedDeliveries"`);
    }
}