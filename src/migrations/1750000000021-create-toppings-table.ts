import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateToppingsTable1750000000021 implements MigrationInterface {
    name = 'CreateToppingsTable1750000000021'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create toppings table
        await queryRunner.query(`
            CREATE TABLE "toppings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "price" numeric(10,2) NOT NULL DEFAULT '0',
                "isAvailable" boolean NOT NULL DEFAULT true,
                "food_id" uuid,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_toppings" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "toppings" 
            ADD CONSTRAINT "FK_toppings_food" 
            FOREIGN KEY ("food_id") 
            REFERENCES "foods"("id") 
            ON DELETE CASCADE
        `);

        // Add selected_toppings column to orderDetails table
        await queryRunner.query(`
            ALTER TABLE "orderDetails" 
            ADD "selected_toppings" text
        `);

        // Add topping_total column to orderDetails table
        await queryRunner.query(`
            ALTER TABLE "orderDetails" 
            ADD "topping_total" numeric(10,2) DEFAULT '0'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from orderDetails
        await queryRunner.query(`ALTER TABLE "orderDetails" DROP COLUMN "topping_total"`);
        await queryRunner.query(`ALTER TABLE "orderDetails" DROP COLUMN "selected_toppings"`);
        
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "toppings" DROP CONSTRAINT "FK_toppings_food"`);
        
        // Drop toppings table
        await queryRunner.query(`DROP TABLE "toppings"`);
    }
}