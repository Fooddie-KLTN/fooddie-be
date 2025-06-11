import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReviewsToFood1750000000005 implements MigrationInterface {
    name = 'AddReviewsToFood1750000000005';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The reviews table already exists from the main migration
        // This migration just ensures the relationship is properly set up
        // and adds some sample review data

        // Check if reviews table exists, if not this will be handled by main migration
        const reviewsTableExists = await queryRunner.hasTable('reviews');
        
        if (reviewsTableExists) {
            // Add some sample reviews for testing
            const { v4: uuidv4 } = require('uuid');
            
            // Get some sample food IDs and user IDs
            const foods = await queryRunner.query(`SELECT id FROM "foods" LIMIT 15`);
            const users = await queryRunner.query(`SELECT id FROM "users" WHERE username LIKE 'khachhang%' LIMIT 4`);
            
            // Check if we have sufficient data
            if (foods.length >= 6 && users.length >= 2) {
                // Only create as many reviews as we have foods and users for
                const numReviews = Math.min(15, foods.length);
                const reviewIds = Array.from({ length: numReviews }, () => uuidv4());
                
                // Create reviews one by one to avoid parameter mapping issues
                for (let i = 0; i < numReviews; i++) {
                    const userIndex = i % users.length;
                    const foodIndex = i;
                    
                    const comments = [
                        'Phở rất ngon, nước dùng đậm đà, thịt tươi ngon!',
                        'Burger tuyệt vời, giá cả hợp lý',
                        'Cà phê sữa đá chính hiệu, đậm đà thơm ngon',
                        'Pizza khá ổn nhưng hơi mặn',
                        'Sushi tươi ngon, cá hồi rất tuyệt!',
                        'Bánh mì Huỳnh Hoa không thể nào từ chối được',
                        'Gà rán KFC giòn rụm, gia vị đậm đà',
                        'Cappuccino Highlands rất thơm',
                        'Phở gà thanh đạm, nước trong veo',
                        'Trà xanh latte hơi ngọt',
                        'Pizza margherita chuẩn Ý',
                        'Bánh mì pate truyền thống Sài Gòn',
                        'Gà tender strips giòn tan',
                        'Smoothie xoài tươi mát lạnh',
                        'Bánh tiramisu ngọt ngào'
                    ];
                    
                    const ratings = [5, 4, 5, 3, 5, 4, 5, 4, 5, 3, 4, 5, 4, 5, 4];
                    
                    const images = [
                        'https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                        null,
                        null,
                        null,
                        'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80',
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80'
                    ];
                    
                    await queryRunner.query(`
                        INSERT INTO "reviews" ("id", "rating", "comment", "image", "type", "user_id", "food_id", "createdAt") 
                        VALUES ($1, $2, $3, $4, 'food', $5, $6, NOW())
                        ON CONFLICT ("id") DO NOTHING
                    `, [
                        reviewIds[i],
                        ratings[i],
                        comments[i],
                        images[i],
                        users[userIndex].id,
                        foods[foodIndex].id
                    ]);
                }
                
                console.log(`Inserted ${numReviews} sample reviews`);

                // Update food ratings based on reviews
                console.log('Updating food ratings...');
                await queryRunner.query(`
                    UPDATE "foods" 
                    SET "rating" = (
                        SELECT AVG(r.rating)::numeric(3,2)
                        FROM "reviews" r 
                        WHERE r.food_id = "foods".id 
                        AND r.type = 'food'
                        AND r.rating IS NOT NULL
                    )
                    WHERE id IN (
                        SELECT DISTINCT food_id 
                        FROM "reviews" 
                        WHERE type = 'food' 
                        AND rating IS NOT NULL
                    )
                `);

                // Update restaurant ratings based on their foods' reviews
                console.log('Updating restaurant ratings...');
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

                console.log('Updated food and restaurant ratings successfully');
            } else {
                console.log(`Insufficient data for reviews: ${foods.length} foods, ${users.length} users`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Reset restaurant ratings to null
        await queryRunner.query(`
            UPDATE "restaurants" 
            SET "rating" = NULL 
            WHERE id IN (
                SELECT DISTINCT f.restaurant_id 
                FROM "foods" f
                INNER JOIN "reviews" r ON r.food_id = f.id
                WHERE r.comment IN (
                    'Phở rất ngon, nước dùng đậm đà, thịt tươi ngon!',
                    'Burger tuyệt vời, giá cả hợp lý',
                    'Cà phê sữa đá chính hiệu, đậm đà thơm ngon',
                    'Pizza khá ổn nhưng hơi mặn',
                    'Sushi tươi ngon, cá hồi rất tuyệt!',
                    'Bánh mì Huỳnh Hoa không thể nào từ chối được',
                    'Gà rán KFC giòn rụm, gia vị đậm đà',
                    'Cappuccino Highlands rất thơm',
                    'Phở gà thanh đạm, nước trong veo',
                    'Trà xanh latte hơi ngọt',
                    'Pizza margherita chuẩn Ý',
                    'Bánh mì pate truyền thống Sài Gòn',
                    'Gà tender strips giòn tan',
                    'Smoothie xoài tươi mát lạnh',
                    'Bánh tiramisu ngọt ngào'
                )
            )
        `);

        // Reset food ratings to null
        await queryRunner.query(`
            UPDATE "foods" 
            SET "rating" = NULL 
            WHERE id IN (
                SELECT DISTINCT food_id 
                FROM "reviews" 
                WHERE "comment" IN (
                    'Phở rất ngon, nước dùng đậm đà, thịt tươi ngon!',
                    'Burger tuyệt vời, giá cả hợp lý',
                    'Cà phê sữa đá chính hiệu, đậm đà thơm ngon',
                    'Pizza khá ổn nhưng hơi mặn',
                    'Sushi tươi ngon, cá hồi rất tuyệt!',
                    'Bánh mì Huỳnh Hoa không thể nào từ chối được',
                    'Gà rán KFC giòn rụm, gia vị đậm đà',
                    'Cappuccino Highlands rất thơm',
                    'Phở gà thanh đạm, nước trong veo',
                    'Trà xanh latte hơi ngọt',
                    'Pizza margherita chuẩn Ý',
                    'Bánh mì pate truyền thống Sài Gòn',
                    'Gà tender strips giòn tan',
                    'Smoothie xoài tươi mát lạnh',
                    'Bánh tiramisu ngọt ngào'
                )
            )
        `);

        // Remove sample review data
        await queryRunner.query(`
            DELETE FROM "reviews" 
            WHERE "comment" IN (
                'Phở rất ngon, nước dùng đậm đà, thịt tươi ngon!',
                'Burger tuyệt vời, giá cả hợp lý',
                'Cà phê sữa đá chính hiệu, đậm đà thơm ngon',
                'Pizza khá ổn nhưng hơi mặn',
                'Sushi tươi ngon, cá hồi rất tuyệt!',
                'Bánh mì Huỳnh Hoa không thể nào từ chối được',
                'Gà rán KFC giòn rụm, gia vị đậm đà',
                'Cappuccino Highlands rất thơm',
                'Phở gà thanh đạm, nước trong veo',
                'Trà xanh latte hơi ngọt',
                'Pizza margherita chuẩ Ý',
                'Bánh mì pate truyền thống Sài Gòn',
                'Gà tender strips giòn tan',
                'Smoothie xoài tươi mát lạnh',
                'Bánh tiramisu ngọt ngào'
            )
        `);
    }
}