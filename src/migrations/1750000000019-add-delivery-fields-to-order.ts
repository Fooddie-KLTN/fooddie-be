import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeliveryFieldsToOrder1750000000019 implements MigrationInterface {
    name = 'AddDeliveryFieldsToOrder1750000000019'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" ADD "deliveryDistance" float`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "estimatedDeliveryTime" integer`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "deliveryType" character varying DEFAULT 'asap'`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "requestedDeliveryTime" character varying`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shippingFee" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shippingFee"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "requestedDeliveryTime"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "deliveryType"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "estimatedDeliveryTime"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "deliveryDistance"`);
    }
}