import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShipperReceivedOrderStatus1750000000022 implements MigrationInterface {
    name = 'AddShipperReceivedOrderStatus1750000000022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the new status to the existing enum
        await queryRunner.query(`
            ALTER TYPE "public"."orders_status_enum" 
            ADD VALUE 'shipper_received' AFTER 'delivering'
        `);

        console.log('Added "shipper_received" status to orders_status_enum');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: PostgreSQL doesn't support removing enum values directly
        // We need to recreate the enum without the new value
        
        // Create a new enum without 'shipper_received'
        await queryRunner.query(`
            CREATE TYPE "orders_status_enum_old" AS ENUM(
                'pending', 
                'confirmed', 
                'delivering', 
                'completed', 
                'canceled', 
                'processing_payment'
            )
        `);

        // Update the column to use the old enum
        await queryRunner.query(`
            ALTER TABLE "orders" 
            ALTER COLUMN "status" TYPE "orders_status_enum_old" 
            USING "status"::text::"orders_status_enum_old"
        `);

        // Drop the new enum
        await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);

        // Rename the old enum back
        await queryRunner.query(`
            ALTER TYPE "orders_status_enum_old" 
            RENAME TO "orders_status_enum"
        `);

        console.log('Removed "shipper_received" status from orders_status_enum');
    }
}