import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsTemporaryToAddress1750000000023 implements MigrationInterface {
    name = 'AddIsTemporaryToAddress1750000000023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add isTemporary column to address table
        await queryRunner.query(`
            ALTER TABLE "address" 
            ADD COLUMN "isTemporary" boolean NOT NULL DEFAULT false
        `);

        // Add createdAt column to address table (if it doesn't exist)
        await queryRunner.query(`
            ALTER TABLE "address" 
            ADD COLUMN "createdAt" TIMESTAMP NOT NULL DEFAULT now()
        `);

        // Create index for better performance when querying temporary addresses
        await queryRunner.query(`
            CREATE INDEX "IDX_address_isTemporary" 
            ON "address" ("isTemporary")
        `);

        // Create index for cleanup operations (temporary addresses + createdAt)
        await queryRunner.query(`
            CREATE INDEX "IDX_address_temporary_cleanup" 
            ON "address" ("isTemporary", "createdAt") 
            WHERE "isTemporary" = true
        `);

        console.log('Added isTemporary field to address table with indexes');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_address_temporary_cleanup"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_address_isTemporary"
        `);

        // Remove the columns
        await queryRunner.query(`
            ALTER TABLE "address" 
            DROP COLUMN IF EXISTS "isTemporary"
        `);

        await queryRunner.query(`
            ALTER TABLE "address" 
            DROP COLUMN IF EXISTS "createdAt"
        `);

        console.log('Removed isTemporary and createdAt fields from address table');
    }
}