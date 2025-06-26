import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateConversationEntity1750000000010 implements MigrationInterface {
    name = 'UpdateConversationEntity1750000000010';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update conversationType to use enum
        await queryRunner.query(`
            ALTER TABLE "conversations" 
            DROP COLUMN IF EXISTS "conversationType"
        `);

        await queryRunner.query(`
            CREATE TYPE "conversation_type_enum" AS ENUM('customer_shop', 'customer_shipper', 'support')
        `);

        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD COLUMN "conversationType" "conversation_type_enum" NOT NULL DEFAULT 'customer_shop'
        `);

        // Add restaurantId column
        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD COLUMN "restaurantId" uuid
        `);

        // Add foreign key constraint for restaurantId
        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD CONSTRAINT "FK_conversations_restaurant" 
            FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Add indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_type_restaurant" 
            ON "conversations" ("conversationType", "restaurantId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_type_order" 
            ON "conversations" ("conversationType", "orderId")
        `);

        console.log('Updated conversation entity with business logic fields');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_type_order"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_type_restaurant"`);

        // Drop foreign key
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_restaurant"`);

        // Drop columns
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "restaurantId"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "conversationType"`);

        // Drop enum type
        await queryRunner.query(`DROP TYPE IF EXISTS "conversation_type_enum"`);

        // Restore old conversationType column
        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD COLUMN "conversationType" character varying DEFAULT 'direct'
        `);

        console.log('Reverted conversation entity changes');
    }
}