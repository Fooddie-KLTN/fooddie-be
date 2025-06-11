import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRatingToRestaurant1750000000004 implements MigrationInterface {
    name = 'AddRatingToRestaurant1750000000004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add rating column to restaurants table
        await queryRunner.query(`
            ALTER TABLE "restaurants" 
            ADD COLUMN IF NOT EXISTS "rating" DECIMAL(3,2) NULL
        `);

        console.log('Added rating column to restaurants table');

        // Update existing restaurant ratings based on their foods' reviews
        console.log('Calculating and updating restaurant ratings...');
        
        await queryRunner.query(`
            UPDATE "restaurants" 
            SET "rating" = (
                SELECT AVG(r.rating)::numeric(3,2)
                FROM "reviews" r 
                INNER JOIN "foods" f ON r.food_id = f.id
                WHERE f.restaurant_id = "restaurants".id 
                AND r.type = 'food'
                AND r.rating IS NOT NULL
            )
            WHERE id IN (
                SELECT DISTINCT f.restaurant_id 
                FROM "foods" f
                INNER JOIN "reviews" r ON r.food_id = f.id
                WHERE r.type = 'food' 
                AND r.rating IS NOT NULL
            )
        `);

        console.log('Updated restaurant ratings based on food reviews');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove rating column from restaurants table
        await queryRunner.query(`
            ALTER TABLE "restaurants" 
            DROP COLUMN IF EXISTS "rating"
        `);

        console.log('Removed rating column from restaurants table');
    }
}