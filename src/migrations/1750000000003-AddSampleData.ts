import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class AddSampleData1750000000003 implements MigrationInterface {
    name = 'AddSampleData1750000000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Generate UUIDs
        const addressIds = Array.from({ length: 6 }, () => uuidv4());
        const userIds = Array.from({ length: 6 }, () => uuidv4().substring(0, 28)); // 6 users now
        const categoryIds = Array.from({ length: 12 }, () => uuidv4()); // Changed from 6 to 12
        const restaurantIds = Array.from({ length: 3 }, () => uuidv4());
        const foodIds = Array.from({ length: 6 }, () => uuidv4());
        const promoIds = Array.from({ length: 3 }, () => uuidv4());
        const orderIds = Array.from({ length: 3 }, () => uuidv4());
        const orderDetailIds = Array.from({ length: 5 }, () => uuidv4());
        const reviewIds = Array.from({ length: 3 }, () => uuidv4());
        const shipperCertIds = Array.from({ length: 1 }, () => uuidv4()); // For shipper certificate

        // 1. Insert Addresses - Vietnamese locations
        await queryRunner.query(`
            INSERT INTO "address" ("id", "street", "ward", "district", "city", "latitude", "longitude", "isDefault") VALUES
            ($1, '123 Nguyễn Văn Linh', 'Phường Tân Phong', 'Quận 7', 'Thành phố Hồ Chí Minh', 10.7269, 106.7180, true),
            ($2, '456 Lê Văn Việt', 'Phường Tăng Nhơn Phú A', 'Quận 9', 'Thành phố Hồ Chí Minh', 10.8411, 106.7980, false),
            ($3, '789 Phạm Văn Đồng', 'Phường Linh Trung', 'Thành phố Thủ Đức', 'Thành phố Hồ Chí Minh', 10.8700, 106.8000, false),
            ($4, '321 Võ Văn Ngân', 'Phường Linh Chiểu', 'Thành phố Thủ Đức', 'Thành phố Hồ Chí Minh', 10.8500, 106.7700, false),
            ($5, '654 Quang Trung', 'Phường 10', 'Quận Gò Vấp', 'Thành phố Hồ Chí Minh', 10.8200, 106.6800, false),
            ($6, '987 Cách Mạng Tháng 8', 'Phường 5', 'Quận 3', 'Thành phố Hồ Chí Minh', 10.7800, 106.6900, false)
            ON CONFLICT ("id") DO NOTHING
        `, addressIds);

        // 2. Insert Sample Users with Vietnamese names
        const userRoleRes = await queryRunner.query(`SELECT id FROM "roles" WHERE name = 'user' LIMIT 1`);
        const shopOwnerRoleRes = await queryRunner.query(`SELECT id FROM "roles" WHERE name = 'shop_owner' LIMIT 1`);
        const shipperRoleRes = await queryRunner.query(`SELECT id FROM "roles" WHERE name = 'shipper' LIMIT 1`);

        const userRoleId = userRoleRes[0]?.id;
        const shopOwnerRoleId = shopOwnerRoleRes[0]?.id;
        const shipperRoleId = shipperRoleRes[0]?.id;

        // Hash passwords like in UsersService
        const hashedPasswords = await Promise.all([
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10)
        ]);

        await queryRunner.query(`
            INSERT INTO "users" ("id", "username", "password", "email", "role_id", "name", "phone", "birthday", "avatar", "authProvider", "is_active") VALUES
            ($1, 'chubep1', $2, 'chubep1@fooddie.com', $3, 'Nguyễn Văn An', '0901234568', '1985-05-15', $19, 'email', true),
            ($4, 'chubep2', $5, 'chubep2@fooddie.com', $6, 'Trần Thị Bình', '0901234569', '1988-08-20', $20, 'email', true),
            ($7, 'chubep3', $8, 'chubep3@fooddie.com', $9, 'Lê Văn Chính', '0901234567', '1987-03-12', $21, 'email', true),
            ($10, 'khachhang1', $11, 'khachhang1@fooddie.com', $12, 'Lê Văn Cường', '0901234570', '1995-03-10', $22, 'email', true),
            ($13, 'khachhang2', $14, 'khachhang2@fooddie.com', $15, 'Phạm Thị Dung', '0901234571', '1992-12-25', $23, 'email', true),
            ($16, 'taixe1', $17, 'taixe1@fooddie.com', $18, 'Hoàng Văn Em', '0901234572', '1990-07-08', $24, 'email', true)
            ON CONFLICT ("id") DO NOTHING
`, [
            userIds[0], hashedPasswords[0], shopOwnerRoleId,
            userIds[1], hashedPasswords[1], shopOwnerRoleId,
            userIds[2], hashedPasswords[2], shopOwnerRoleId,
            userIds[3], hashedPasswords[3], userRoleId,
            userIds[4], hashedPasswords[4], userRoleId,
            userIds[5], hashedPasswords[5], shipperRoleId,
            // Avatar URLs using unique identifiers for consistent avatars
            'https://testingbot.com/free-online-tools/random-avatar/128?u=chubep1@fooddie.com',
            'https://testingbot.com/free-online-tools/random-avatar/128?u=chubep2@fooddie.com',
            'https://testingbot.com/free-online-tools/random-avatar/128?u=chubep3@fooddie.com',
            'https://testingbot.com/free-online-tools/random-avatar/128?u=khachhang1@fooddie.com',
            'https://testingbot.com/free-online-tools/random-avatar/128?u=khachhang2@fooddie.com',
            'https://testingbot.com/free-online-tools/random-avatar/128?u=taixe1@fooddie.com'
        ]);

        // 2.5. Insert Shipper Certificate Information
        await queryRunner.query(`
            INSERT INTO "shipperCertificateInfos" ("id", "user_id", "cccd", "driverLicense", "status", "verifiedAt") VALUES
            ($1, $2, '079090001234', 'B2-123456789', 'APPROVED', '2025-06-01 09:00:00')
            ON CONFLICT ("id") DO NOTHING
        `, [
            shipperCertIds[0], // Certificate ID
            userIds[5]          // taixe1 user ID
        ]);

        // 3. Insert Categories - Vietnamese food categories with icon images
        await queryRunner.query(`
    INSERT INTO "categories" ("id", "name", "image") VALUES
    ($1, 'Món Việt Nam', 'https://cdn-icons-png.flaticon.com/512/3480/3480682.png'),
    ($2, 'Đồ Ăn Nhanh', 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png'),
    ($3, 'Đồ Uống', 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png'),
    ($4, 'Tráng Miệng', 'https://cdn-icons-png.flaticon.com/512/992/992651.png'),
    ($5, 'Món Ý', 'https://cdn-icons-png.flaticon.com/512/2718/2718945.png'),
    ($6, 'Món Hàn Quốc', 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png'),
    ($7, 'Pizza', 'https://cdn-icons-png.flaticon.com/512/599/599995.png'),
    ($8, 'Sushi & Món Nhật', 'https://cdn-icons-png.flaticon.com/512/2921/2921825.png'),
    ($9, 'Bánh Mì & Sandwich', 'https://cdn-icons-png.flaticon.com/512/1046/1046751.png'),
    ($10, 'Salad & Healthy', 'https://cdn-icons-png.flaticon.com/512/1046/1046747.png'),
    ($11, 'Gà Rán', 'https://cdn-icons-png.flaticon.com/512/1046/1046786.png'),
    ($12, 'Bánh Ngọt & Bakery', 'https://cdn-icons-png.flaticon.com/512/992/992700.png')
    ON CONFLICT ("id") DO NOTHING
`, categoryIds);

        // 4. Insert Restaurants - Fix: Each user can only own one restaurant + Add latitude/longitude
        await queryRunner.query(`
            INSERT INTO "restaurants" ("id", "name", "description", "avatar", "backgroundImage", "phoneNumber", "certificateImage", "addressId", "owner_id", "status", "latitude", "longitude") VALUES
            ($1, 'Phở Bà Hoành', 'Quán phở truyền thống đậm đà hương vị Việt Nam', 'https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80', '02812345678', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', $2, $3, 'approved', $10, $11),
            ($4, 'Burger King Việt Nam', 'Trải nghiệm burger cao cấp với hương vị tuyệt vời', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80', '02812345679', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', $5, $6, 'approved', $12, $13),
            ($7, 'The Coffee House', 'Chuỗi cà phê Việt Nam với không gian ấm cúng', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80', '02812345680', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', $8, $9, 'approved', $14, $15)
            ON CONFLICT ("id") DO NOTHING
        `, [
            restaurantIds[0], addressIds[0], userIds[0],  // chubep1
            restaurantIds[1], addressIds[1], userIds[1],  // chubep2
            restaurantIds[2], addressIds[2], userIds[2],  // chubep3
            // Latitude and longitude coordinates for Ho Chi Minh City restaurants
            10.7269, 106.7180,  // Phở Bà Hoành (Quận 7)
            10.8411, 106.7980,  // Burger King (Quận 9) 
            10.8700, 106.8000   // The Coffee House (Thủ Đức)
        ]);

        // 5. Insert Foods - Vietnamese food names and descriptions with real images
        await queryRunner.query(`
            INSERT INTO "foods" ("id", "name", "description", "price", "image", "status", "category_id", "restaurant_id", "discount_percent", "sold_count") VALUES
            ($1, 'Phở Bò Tái', 'Tô phở bò truyền thống với bánh phở mềm, nước dùng trong veo', 65000, 'https://images.unsplash.com/photo-1559847844-5315695dadae?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'available', $2, $3, 0, 150),
            ($4, 'Phở Gà', 'Phở gà thơm ngon với thịt gà tươi và nước dùng đậm đà', 60000, 'https://images.unsplash.com/photo-1555126634-323283e090fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'available', $2, $3, 10, 120),
            ($5, 'Burger Whopper', 'Burger bò nướng đặc biệt với rau tươi và sốt đặc trưng', 120000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'available', $6, $7, 15, 200),
            ($8, 'Burger Gà Giòn', 'Burger gà giòn rụm với rau củ tươi ngon', 95000, 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'available', $6, $7, 0, 180),
            ($9, 'Cà Phê Sữa Đá', 'Cà phê sữa đá truyền thống Việt Nam thơm ngon đậm đà', 35000, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'available', $10, $11, 5, 300),
            ($12, 'Trà Xanh Latte', 'Trà xanh matcha pha với sữa tươi thơm béo', 45000, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'available', $10, $11, 0, 250)
            ON CONFLICT ("id") DO NOTHING
        `, [
            foodIds[0], categoryIds[0], restaurantIds[0],
            foodIds[1],
            foodIds[2], categoryIds[1], restaurantIds[1],
            foodIds[3],
            foodIds[4], categoryIds[2], restaurantIds[2],
            foodIds[5]
        ]);

        // 6. Insert Promotions - Vietnamese promotion descriptions with real images
        await queryRunner.query(`
            INSERT INTO "promotions" ("id", "description", "type", "discountPercent", "discountAmount", "minOrderValue", "maxDiscountAmount", "image", "code", "start_date", "end_date", "number_of_used", "max_usage") VALUES
            ($1, 'Giảm 20% cho tất cả đơn hàng thức ăn', 'FOOD_DISCOUNT', 20, null, 100000, 50000, 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'GIAMGIA20', '2025-06-01 00:00:00', '2025-12-31 23:59:59', 15, 1000),
            ($2, 'Miễn phí vận chuyển cho đơn hàng trên 200k', 'SHIPPING_DISCOUNT', null, 25000, 200000, 25000, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'FREESHIP', '2025-06-01 00:00:00', '2025-12-31 23:59:59', 8, 500),
            ($3, 'Giảm 15% cho khách hàng mới', 'FOOD_DISCOUNT', 15, null, 50000, 30000, 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80', 'KHACHMOI15', '2025-06-01 00:00:00', '2025-12-31 23:59:59', 25, 200)
            ON CONFLICT ("id") DO NOTHING
        `, promoIds);

        // 7. Insert Orders - Vietnamese order notes
        await queryRunner.query(`
            INSERT INTO "orders" ("id", "user_id", "restaurant_id", "total", "note", "date", "status", "paymentMethod", "address_id", "promotion_id", "isPaid", "paymentDate") VALUES
            ($1, $2, $3, 125000, 'Cho thêm rau thơm', '2025-06-08 12:30:00', 'completed', 'momo', $4, $5, true, '2025-06-08 12:31:00'),
            ($6, $7, $8, 215000, 'Không hành tây', '2025-06-08 18:45:00', 'completed', 'vnpay', $9, null, true, '2025-06-08 18:46:00'),
            ($10, $2, $11, 80000, 'Ít đá', '2025-06-09 10:15:00', 'processing_payment', 'cod', $4, null, false, null)
            ON CONFLICT ("id") DO NOTHING
`, [
            orderIds[0], userIds[2], restaurantIds[0], addressIds[3], promoIds[0],
            orderIds[1], userIds[3], restaurantIds[1], addressIds[4],
            orderIds[2], restaurantIds[2]
        ]);

        // 8. Insert Order Details - Vietnamese notes
        await queryRunner.query(`
            INSERT INTO "orderDetails" ("id", "order_id", "food_id", "quantity", "price", "note") VALUES
            ($1, $2, $3, 1, '65000', 'Cho thêm rau thơm'),
            ($4, $2, $5, 1, '60000', 'Bình thường'),
            ($6, $7, $8, 1, '120000', 'Không hành tây'),
            ($9, $7, $10, 1, '95000', 'Thêm sốt'),
            ($11, $12, $13, 2, '35000', 'Ít đá')
            ON CONFLICT ("id") DO NOTHING
        `, [
            orderDetailIds[0], orderIds[0], foodIds[0],
            orderDetailIds[1], foodIds[1],
            orderDetailIds[2], orderIds[1], foodIds[2],
            orderDetailIds[3], foodIds[3],
            orderDetailIds[4], orderIds[2], foodIds[4]
        ]);

        // 9. Insert Reviews - Vietnamese comments
        await queryRunner.query(`
            INSERT INTO "reviews" ("id", "user_id", "food_id", "rating", "comment", "type") VALUES
            ($1, $2, $3, 5, 'Phở ngon tuyệt vời! Vị đậm đà truyền thống và phục vụ nhanh chóng.', 'food'),
            ($4, $5, $6, 4, 'Burger ngon nhưng hơi đắt. Quán sạch sẽ, không gian thoải mái.', 'food'),
            ($7, $8, $9, 4, 'Cà phê rất ngon, không gian phù hợp để làm việc. Sẽ quay lại lần nữa.', 'food')
            ON CONFLICT ("id") DO NOTHING
        `, [
            reviewIds[0], userIds[3], foodIds[0],
            reviewIds[1], userIds[4], foodIds[2],
            reviewIds[2], userIds[3], foodIds[4]
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove all sample data in reverse order
        await queryRunner.query(`DELETE FROM "reviews" WHERE "user_id" IN (SELECT id FROM "users" WHERE username IN ('chubep1', 'chubep2', 'chubep3', 'khachhang1', 'khachhang2', 'taixe1'))`);
        await queryRunner.query(`DELETE FROM "orderDetails" WHERE "order_id" IN (SELECT id FROM "orders" WHERE "user_id" IN (SELECT id FROM "users" WHERE username IN ('chubep1', 'chubep2', 'chubep3', 'khachhang1', 'khachhang2', 'taixe1')))`);
        await queryRunner.query(`DELETE FROM "orders" WHERE "user_id" IN (SELECT id FROM "users" WHERE username IN ('chubep1', 'chubep2', 'chubep3', 'khachhang1', 'khachhang2', 'taixe1'))`);
        await queryRunner.query(`DELETE FROM "promotions" WHERE code IN ('GIAMGIA20', 'FREESHIP', 'KHACHMOI15')`);
        await queryRunner.query(`DELETE FROM "foods" WHERE "restaurant_id" IN (SELECT id FROM "restaurants" WHERE name IN ('Phở Bà Hoành', 'Burger King Việt Nam', 'The Coffee House'))`);
        await queryRunner.query(`DELETE FROM "restaurants" WHERE name IN ('Phở Bà Hoành', 'Burger King Việt Nam', 'The Coffee House')`);
        await queryRunner.query(`DELETE FROM "categories" WHERE name IN ('Món Việt Nam', 'Đồ Ăn Nhanh', 'Đồ Uống', 'Tráng Miệng', 'Món Ý', 'Món Hàn Quốc', 'Pizza', 'Sushi & Món Nhật', 'Bánh Mì & Sandwich', 'Salad & Healthy', 'Gà Rán', 'Bánh Ngọt & Bakery')`);
        await queryRunner.query(`DELETE FROM "shipperCertificateInfos" WHERE "user_id" IN (SELECT id FROM "users" WHERE username = 'taixe1')`);
        await queryRunner.query(`DELETE FROM "users" WHERE username IN ('chubep1', 'chubep2', 'chubep3', 'khachhang1', 'khachhang2', 'taixe1')`);
        await queryRunner.query(`DELETE FROM "address" WHERE street IN ('123 Nguyễn Văn Linh', '456 Lê Văn Việt', '789 Phạm Văn Đồng', '321 Võ Văn Ngân', '654 Quang Trung', '987 Cách Mạng Tháng 8')`);
    }
}