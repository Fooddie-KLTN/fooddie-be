// Create a new migration file
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAddressForeignKey1750000000006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the existing foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "orders" 
            DROP CONSTRAINT "FK_d39c53244703b8534307adcd073"
        `);
        
        // Add the new constraint with SET NULL on delete
        await queryRunner.query(`
            ALTER TABLE "orders" 
            ADD CONSTRAINT "FK_d39c53244703b8534307adcd073" 
            FOREIGN KEY ("address_id") REFERENCES "address"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to the original constraint
        await queryRunner.query(`
            ALTER TABLE "orders" 
            DROP CONSTRAINT "FK_d39c53244703b8534307adcd073"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "orders" 
            ADD CONSTRAINT "FK_d39c53244703b8534307adcd073" 
            FOREIGN KEY ("address_id") REFERENCES "address"("id") 
            ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }
}