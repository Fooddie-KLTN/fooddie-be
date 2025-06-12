import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePendingShipperAssignment1750000000007 implements MigrationInterface {
    name = 'CreatePendingShipperAssignment1750000000007';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the pending_shipper_assignments table
        await queryRunner.query(`
            CREATE TABLE "pending_shipper_assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "priority" integer NOT NULL DEFAULT 1,
                "attemptCount" integer NOT NULL DEFAULT 0,
                "lastAttemptAt" TIMESTAMP,
                "nextAttemptAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "notes" text,
                "order_id" uuid,
                CONSTRAINT "PK_pending_shipper_assignments" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraint to orders table
        await queryRunner.query(`
            ALTER TABLE "pending_shipper_assignments" 
            ADD CONSTRAINT "FK_pending_shipper_assignments_order" 
            FOREIGN KEY ("order_id") REFERENCES "orders"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX "IDX_pending_shipper_assignments_createdAt" 
            ON "pending_shipper_assignments" ("createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_pending_shipper_assignments_priority_createdAt" 
            ON "pending_shipper_assignments" ("priority", "createdAt")
        `);

        console.log('Created pending_shipper_assignments table with indexes');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_shipper_assignments_priority_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_pending_shipper_assignments_createdAt"`);

        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "pending_shipper_assignments" 
            DROP CONSTRAINT IF EXISTS "FK_pending_shipper_assignments_order"
        `);

        // Drop the table
        await queryRunner.query(`DROP TABLE IF EXISTS "pending_shipper_assignments"`);

        console.log('Dropped pending_shipper_assignments table');
    }
}