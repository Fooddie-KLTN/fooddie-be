import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsSentToShipperField1750000000008 implements MigrationInterface {
    name = 'AddIsSentToShipperField1750000000008';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the isSentToShipper column
        await queryRunner.query(`
            ALTER TABLE "pending_shipper_assignments" 
            ADD COLUMN "isSentToShipper" boolean NOT NULL DEFAULT false
        `);

        // Create index for the new field
        await queryRunner.query(`
            CREATE INDEX "IDX_pending_shipper_assignments_isSentToShipper" 
            ON "pending_shipper_assignments" ("isSentToShipper")
        `);

        console.log('Added isSentToShipper field to pending_shipper_assignments table');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_pending_shipper_assignments_isSentToShipper"
        `);

        // Drop the column
        await queryRunner.query(`
            ALTER TABLE "pending_shipper_assignments" 
            DROP COLUMN IF EXISTS "isSentToShipper"
        `);

        console.log('Removed isSentToShipper field from pending_shipper_assignments table');
    }
}