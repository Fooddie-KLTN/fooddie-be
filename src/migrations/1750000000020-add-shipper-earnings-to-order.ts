import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShipperEarningsToOrder1750000000020 implements MigrationInterface {
    name = 'AddShipperEarningsToOrder1750000000020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add shipper earnings and commission fields to orders table
        await queryRunner.query(`ALTER TABLE "orders" ADD "shipperEarnings" integer`);
        await queryRunner.query(`ALTER TABLE "orders" ADD "shipperCommissionRate" float DEFAULT 0.8`);
        

    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shipperCommissionRate"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "shipperEarnings"`);
    }
}