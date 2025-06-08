import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromotionTypes1750000000002 implements MigrationInterface {
    name = 'AddPromotionTypes1750000000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add type enum column
        await queryRunner.query(`
            CREATE TYPE "promotion_type_enum" AS ENUM('FOOD_DISCOUNT', 'SHIPPING_DISCOUNT')
        `);
        
        await queryRunner.query(`
            ALTER TABLE "promotions" 
            ADD COLUMN "type" "promotion_type_enum" NOT NULL DEFAULT 'FOOD_DISCOUNT'
        `);

        // Add new discount fields
        await queryRunner.query(`
            ALTER TABLE "promotions" 
            ADD COLUMN "discountAmount" DECIMAL(10,2)
        `);
        
        await queryRunner.query(`
            ALTER TABLE "promotions" 
            ADD COLUMN "minOrderValue" DECIMAL(10,2)
        `);
        
        await queryRunner.query(`
            ALTER TABLE "promotions" 
            ADD COLUMN "maxDiscountAmount" DECIMAL(10,2)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "maxDiscountAmount"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "minOrderValue"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "discountAmount"`);
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "promotion_type_enum"`);
    }
}