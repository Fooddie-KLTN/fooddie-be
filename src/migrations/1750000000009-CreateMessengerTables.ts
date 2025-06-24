import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessengerTables1750000000009 implements MigrationInterface {
    name = 'CreateMessengerTables1750000000009';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create conversations table
        await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "participant1_id" character varying(28) NOT NULL,
                "participant2_id" character varying(28) NOT NULL,
                "lastMessage" text,
                "lastMessageAt" TIMESTAMP,
                "isBlocked" boolean NOT NULL DEFAULT false,
                "blockedBy" character varying(28),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "conversationType" character varying DEFAULT 'direct',
                "orderId" uuid,
                CONSTRAINT "PK_conversations" PRIMARY KEY ("id")
            )
        `);

        // Create messages table
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "conversation_id" uuid NOT NULL,
                "sender_id" character varying(28) NOT NULL,
                "content" text NOT NULL,
                "messageType" character varying DEFAULT 'text',
                "attachmentUrl" character varying,
                "attachmentType" character varying,
                "isRead" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP,
                "isEdited" boolean NOT NULL DEFAULT false,
                "editedAt" TIMESTAMP,
                "isDeleted" boolean NOT NULL DEFAULT false,
                "deletedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "metadata" jsonb,
                "replyToMessageId" uuid,
                CONSTRAINT "PK_messages" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints for conversations
        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD CONSTRAINT "FK_conversations_participant1" 
            FOREIGN KEY ("participant1_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD CONSTRAINT "FK_conversations_participant2" 
            FOREIGN KEY ("participant2_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD CONSTRAINT "FK_conversations_order" 
            FOREIGN KEY ("orderId") REFERENCES "orders"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Add foreign key constraints for messages
        await queryRunner.query(`
            ALTER TABLE "messages" 
            ADD CONSTRAINT "FK_messages_conversation" 
            FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "messages" 
            ADD CONSTRAINT "FK_messages_sender" 
            FOREIGN KEY ("sender_id") REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "messages" 
            ADD CONSTRAINT "FK_messages_reply" 
            FOREIGN KEY ("replyToMessageId") REFERENCES "messages"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_participant1_participant2" 
            ON "conversations" ("participant1_id", "participant2_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_lastMessageAt" 
            ON "conversations" ("lastMessageAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_orderId" 
            ON "conversations" ("orderId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_conversation_createdAt" 
            ON "messages" ("conversation_id", "createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_sender_createdAt" 
            ON "messages" ("sender_id", "createdAt")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_isRead" 
            ON "messages" ("isRead")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_messages_messageType" 
            ON "messages" ("messageType")
        `);

        // Create unique constraint to prevent duplicate conversations between same participants
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_conversations_unique_participants" 
            ON "conversations" (
                LEAST("participant1_id", "participant2_id"), 
                GREATEST("participant1_id", "participant2_id")
            ) WHERE "conversationType" = 'direct'
        `);

        console.log('Created messenger tables (conversations and messages) with indexes and constraints');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_unique_participants"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_messageType"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_isRead"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_sender_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_messages_conversation_createdAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_orderId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_lastMessageAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_participant1_participant2"`);

        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "FK_messages_reply"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "FK_messages_sender"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "FK_messages_conversation"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_order"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_participant2"`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "FK_conversations_participant1"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);

        console.log('Removed messenger tables (conversations and messages)');
    }
}