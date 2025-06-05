import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDateAndUsageToPromotion1750000000001 implements MigrationInterface {
    name = 'AddDateAndUsageToPromotion1750000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotions" ADD COLUMN "start_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "promotions" ADD COLUMN "end_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "promotions" ADD COLUMN "number_of_used" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "promotions" ADD COLUMN "max_usage" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "max_usage"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "number_of_used"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "end_date"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "start_date"`);
    }
}