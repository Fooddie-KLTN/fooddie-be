import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSystemConstraintsTable1750000000017 implements MigrationInterface {
    name = 'CreateSystemConstraintsTable1750000000017'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "system_constraints" (
                "id" SERIAL PRIMARY KEY,
                "min_completion_rate" float NOT NULL DEFAULT 0.7,
                "min_total_orders" integer NOT NULL DEFAULT 10,
                "max_active_deliveries" integer NOT NULL DEFAULT 3,
                "max_delivery_distance" float NOT NULL DEFAULT 30,
                "min_shipper_rating" float NOT NULL DEFAULT 3.5,
                "max_delivery_time_min" integer NOT NULL DEFAULT 45,
                "base_distance_km" float NOT NULL DEFAULT 5,
                "base_shipping_fee" integer NOT NULL DEFAULT 15000,
                "tier2_distance_km" float NOT NULL DEFAULT 10,
                "tier2_shipping_fee" integer NOT NULL DEFAULT 25000,
                "tier3_shipping_fee" integer NOT NULL DEFAULT 35000,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system_constraints"`);
    }
}