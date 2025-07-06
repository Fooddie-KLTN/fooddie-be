import { MigrationInterface, QueryRunner } from "typeorm";
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export class AddSampleData1750000000003 implements MigrationInterface {
    name = 'AddSampleData1750000000003';

    // Move UUID arrays to class level so they're accessible in both up() and down()
    private readonly addressIds = Array.from({ length: 6 }, () => uuidv4());
    private readonly userIds = Array.from({ length: 6 }, () => uuidv4().substring(0, 28)); // varchar(28)
    private readonly categoryIds = Array.from({ length: 8 }, () => uuidv4());
    private readonly restaurantIds = Array.from({ length: 4 }, () => uuidv4());
    private readonly foodIds = Array.from({ length: 35 }, () => uuidv4()); // full UUIDs
    private readonly promoIds = Array.from({ length: 3 }, () => uuidv4());
    private readonly orderIds = Array.from({ length: 4 }, () => uuidv4());
    private readonly orderDetailIds = Array.from({ length: 8 }, () => uuidv4());
    private readonly reviewIds = Array.from({ length: 12 }, () => uuidv4());
    private readonly shipperCertIds = Array.from({ length: 1 }, () => uuidv4());

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Insert Addresses - Fix table name to match entity
        await queryRunner.query(`
            INSERT INTO "address" ("id", "street", "ward", "district", "city", "latitude", "longitude", "isDefault") VALUES
            ($1, '123 Nguyễn Văn Linh', 'Phường Tân Phong', 'Quận 7', 'Thành phố Hồ Chí Minh', 10.7269, 106.7180, true),
            ($2, '456 Lê Văn Việt', 'Phường Tăng Nhơn Phú A', 'Quận 9', 'Thành phố Hồ Chí Minh', 10.8411, 106.7980, false),
            ($3, '789 Phạm Văn Đồng', 'Phường Linh Trung', 'Thành phố Thủ Đức', 'Thành phố Hồ Chí Minh', 10.8700, 106.8000, false),
            ($4, '321 Võ Văn Ngân', 'Phường Linh Chiểu', 'Thành phố Thủ Đức', 'Thành phố Hồ Chí Minh', 10.8500, 106.7700, false),
            ($5, '654 Quang Trung', 'Phường 10', 'Quận Gò Vấp', 'Thành phố Hồ Chí Minh', 10.8200, 106.6800, false),
            ($6, '987 Cách Mạng Tháng 8', 'Phường 5', 'Quận 3', 'Thành phố Hồ Chí Minh', 10.7800, 106.6900, false)
            ON CONFLICT ("id") DO NOTHING
        `, this.addressIds);

        // 2. Get role IDs
        const userRoleRes = await queryRunner.query(`SELECT id FROM "roles" WHERE name = 'user' LIMIT 1`);
        const shopOwnerRoleRes = await queryRunner.query(`SELECT id FROM "roles" WHERE name = 'shop_owner' LIMIT 1`);
        const shipperRoleRes = await queryRunner.query(`SELECT id FROM "roles" WHERE name = 'shipper' LIMIT 1`);

        const userRoleId = userRoleRes[0]?.id;
        const shopOwnerRoleId = shopOwnerRoleRes[0]?.id;
        const shipperRoleId = shipperRoleRes[0]?.id;

        // Hash passwords
        const hashedPasswords = await Promise.all([
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10),
            bcrypt.hash('password123', 10)
        ]);

        // 3. Insert Users with proper avatar URLs
        await queryRunner.query(`
            INSERT INTO "users" ("id", "username", "password", "email", "role_id", "name", "phone", "birthday", "avatar", "authProvider", "is_active") VALUES
            ($1, 'chubep1', $7, 'chubep1@fooddie.com', $13, 'Nguyễn Văn An - Chủ Phở', '0901234568', '1985-05-15', $19, 'email', true),
            ($2, 'chubep2', $8, 'chubep2@fooddie.com', $14, 'Trần Thị Bình - Chủ Cơm Tấm', '0901234569', '1988-08-20', $20, 'email', true),
            ($3, 'chubep3', $9, 'chubep3@fooddie.com', $15, 'Lê Văn Chính - Chủ Bánh Mì', '0901234567', '1987-03-12', $21, 'email', true),
            ($4, 'chubep4', $10, 'chubep4@fooddie.com', $16, 'Phạm Thị Dung - Chủ Chè', '0901234566', '1990-02-28', $22, 'email', true),
            ($5, 'khachhang1', $11, 'khachhang1@fooddie.com', $17, 'Lê Văn Cường', '0901234570', '1995-03-10', $23, 'email', true),
            ($6, 'taixe1', $12, 'taixe1@fooddie.com', $18, 'Hoàng Văn Em', '0901234572', '1990-07-08', $24, 'email', true)
            ON CONFLICT ("id") DO NOTHING
        `, [
            this.userIds[0], this.userIds[1], this.userIds[2], this.userIds[3], this.userIds[4], this.userIds[5],
            hashedPasswords[0], hashedPasswords[1], hashedPasswords[2], hashedPasswords[3], hashedPasswords[4], hashedPasswords[5],
            shopOwnerRoleId, shopOwnerRoleId, shopOwnerRoleId, shopOwnerRoleId, userRoleId, shipperRoleId,
            'https://avatar.iran.liara.run/public/boy?username=chubep1',
            'https://avatar.iran.liara.run/public/girl?username=chubep2',
            'https://avatar.iran.liara.run/public/boy?username=chubep3',
            'https://avatar.iran.liara.run/public/girl?username=chubep4',
            'https://avatar.iran.liara.run/public/boy?username=khachhang1',
            'https://avatar.iran.liara.run/public/boy?username=taixe1'
        ]);

        // 4. Insert Shipper Certificate Information
        await queryRunner.query(`
            INSERT INTO "shipperCertificateInfos" ("id", "user_id", "cccd", "driverLicense", "status", "verifiedAt") VALUES
            ($1, $2, '079090001234', 'B2-123456789', 'APPROVED', '2025-06-01 09:00:00')
            ON CONFLICT ("id") DO NOTHING
        `, [this.shipperCertIds[0], this.userIds[5]]);

        // 5. Insert Vietnamese Food Categories with proper food icons
        await queryRunner.query(`
            INSERT INTO "categories" ("id", "name", "image") VALUES
            ($1, 'Phở & Bún', 'https://cdn-icons-png.flaticon.com/512/3480/3480682.png'),
            ($2, 'Cơm & Món Mặn', 'https://cdn-icons-png.flaticon.com/512/1046/1046784.png'),
            ($3, 'Bánh Mì & Ăn Vặt', 'https://cdn-icons-png.flaticon.com/512/1046/1046751.png'),
            ($4, 'Đồ Uống Việt Nam', 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png'),
            ($5, 'Chè & Tráng Miệng', 'https://cdn-icons-png.flaticon.com/512/992/992651.png'),
            ($6, 'Nem & Gỏi Cuốn', 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png'),
            ($7, 'Bánh Xèo & Bánh Kẹp', 'https://cdn-icons-png.flaticon.com/512/599/599995.png'),
            ($8, 'Lẩu & Nướng', 'https://cdn-icons-png.flaticon.com/512/2921/2921825.png')
            ON CONFLICT ("id") DO NOTHING
        `, this.categoryIds);

        // 6. Insert Vietnamese Restaurants with proper images
        await queryRunner.query(`
            INSERT INTO "restaurants" ("id", "name", "description", "avatar", "backgroundImage", "phoneNumber", "certificateImage", "addressId", "owner_id", "status", "latitude", "longitude", "openTime", "closeTime", "licenseCode") VALUES
            ($1, 'Phở Hương Việt', 'Quán phở truyền thống 3 đời nổi tiếng Sài Gòn với nước dùng niêu từ xương bò', 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=500', 'https://images.pexels.com/photos/4051701/pexels-photo-4051701.jpeg?w=1200', '02812345678', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=800', $5, $9, 'approved', $13, $14, '05:30', '22:00', 'REST001VN'),
            ($2, 'Cơm Tấm Sài Gòn', 'Cơm tấm sườn nướng đặc sản miền Nam với nước mắm pha chuẩn vị', 'https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=500', 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=1200', '02812345679', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=800', $6, $10, 'approved', $15, $16, '06:00', '23:30', 'REST002VN'),
            ($3, 'Bánh Mì Bà Nga', 'Bánh mì Sài Gòn truyền thống với pate gan và chả cua thơm ngon', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=500', 'https://images.pexels.com/photos/5503009/pexels-photo-5503009.jpeg?w=1200', '02812345680', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=800', $7, $11, 'approved', $17, $18, '05:00', '20:00', 'REST003VN'),
            ($4, 'Chè Cung Đình', 'Chè và tráng miệng Việt Nam với hơn 20 loại chè đặc sắc', 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=500', 'https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=1200', '02812345681', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=800', $8, $12, 'approved', $19, $20, '08:00', '22:30', 'REST004VN')
            ON CONFLICT ("id") DO NOTHING
        `, [
            this.restaurantIds[0], this.restaurantIds[1], this.restaurantIds[2], this.restaurantIds[3],
            this.addressIds[0], this.addressIds[1], this.addressIds[2], this.addressIds[3],
            this.userIds[0], this.userIds[1], this.userIds[2], this.userIds[3],
            10.7269, 106.7180, 10.8411, 106.7980, 10.8700, 106.8000, 10.7800, 106.6900
        ]);

        // 7. Insert Vietnamese Foods with authentic food images
        await queryRunner.query(`
            INSERT INTO "foods" ("id", "name", "description", "price", "image", "image_urls", "category_id", "restaurant_id", "status", "discount_percent", "sold_count", "rating", "purchased_number", "preparation_time", "tag") VALUES
            -- Phở Hương Việt (Restaurant 1) - 8 foods
            ($1, 'Phở Bò Tái', 'Phở bò tái truyền thống với bánh phở dai ngon, nước dùng trong veo từ xương bò niêu 8 tiếng', 75000, 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400,https://images.pexels.com/photos/4051701/pexels-photo-4051701.jpeg?w=400', $36, $40, 'available', 0, 350, 4.9, 350, 15, 'signature'),
            ($2, 'Phở Gà', 'Phở gà thơm ngon với thịt gà ta tươi, nước dùng thanh ngọt', 70000, 'https://images.pexels.com/photos/4051701/pexels-photo-4051701.jpeg?w=400', 'https://images.pexels.com/photos/4051701/pexels-photo-4051701.jpeg?w=400,https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', $37, $41, 'available', 10, 280, 4.7, 280, 12, 'healthy'),
            ($3, 'Bún Bò Huế', 'Bún bò Huế cay nồng đặc trưng miền Trung với chả cua, giò heo', 80000, 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400', 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400,https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', $38, $42, 'available', 0, 220, 4.6, 220, 18, 'spicy'),
            ($4, 'Bún Chả Hà Nội', 'Bún chả Hà Nội với thịt nướng thơm phức, nước chấm chua ngọt đậm đà', 85000, 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400', 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400,https://images.pexels.com/photos/4051701/pexels-photo-4051701.jpeg?w=400', $39, $43, 'available', 15, 180, 4.8, 180, 20, 'popular'),
            ($5, 'Bún Riêu Cua', 'Bún riêu cua đồng với cua đồng tươi, cà chua chín mọng', 78000, 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400', 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400,https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', $44, $48, 'available', 0, 160, 4.5, 160, 16, 'traditional'),
            ($6, 'Phở Bò Chín', 'Phở bò chín với thịt bò chín mềm, nước dùng đậm đà truyền thống', 75000, 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400,https://images.pexels.com/photos/4051701/pexels-photo-4051701.jpeg?w=400', $45, $49, 'available', 0, 290, 4.7, 290, 15, 'classic'),
            ($7, 'Bún Thịt Nướng', 'Bún thịt nướng miền Nam với thịt nướng thơm lừng, rau sống tươi mát', 72000, 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400', 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400,https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', $46, $50, 'available', 5, 195, 4.6, 195, 18, 'grilled'),
            ($8, 'Phở Đặc Biệt', 'Phở đặc biệt với tái, chín, gầu, gân và sách đầy đủ', 88000, 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400,https://images.pexels.com/photos/4051701/pexels-photo-4051701.jpeg?w=400', $47, $51, 'available', 0, 150, 4.9, 150, 20, 'premium'),
            
            -- Cơm Tấm Sài Gòn (Restaurant 2) - 9 foods
            ($9, 'Cơm Tấm Sườn Nướng', 'Cơm tấm sườn nướng đặc sản Sài Gòn với chả trứng, bì', 65000, 'https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', 'https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400,https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', $52, $56, 'available', 0, 420, 4.7, 420, 18, 'bestseller'),
            ($10, 'Cơm Gà Xối Mỡ', 'Cơm gà xối mỏ Hội An thơm ngon với nước mắm pha đặc biệt', 68000, 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400,https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', $53, $57, 'available', 10, 280, 4.6, 280, 15, 'famous'),
            ($11, 'Cơm Chiên Dương Châu', 'Cơm chiên Dương Châu với tôm tươi, xúc xích, rau củ đầy đủ', 72000, 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400,https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', $54, $58, 'available', 0, 310, 4.4, 310, 12, 'comfort'),
            ($12, 'Cơm Âm Phủ', 'Cơm âm phủ đặc sắc với nhiều loại thịt nướng và rau sống', 89000, 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400,https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', $55, $59, 'available', 20, 150, 4.8, 150, 25, 'premium'),
            ($13, 'Cơm Hến', 'Cơm hến Huế đặc trưng với nước mắm ruốc và rau thơm', 55000, 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400,https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', $60, $64, 'available', 0, 95, 4.3, 95, 20, 'regional'),
            ($14, 'Cơm Tấm Bì Chả', 'Cơm tấm bì chả truyền thống với bì sợi và chả trứng thơm ngon', 58000, 'https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', 'https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400,https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', $61, $65, 'available', 0, 380, 4.5, 380, 16, 'traditional'),
            ($15, 'Cơm Sườn Cốt Lết', 'Cơm sườn cốt lết chiên giòn với nước mắm chanh đặc biệt', 75000, 'https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', 'https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400,https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', $62, $66, 'available', 15, 210, 4.7, 210, 20, 'crispy'),
            ($16, 'Cơm Gà Nướng', 'Cơm gà nướng ngũ vị hương thơm lừng với cơm dẻo', 70000, 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400,https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', $63, $67, 'available', 0, 165, 4.6, 165, 22, 'aromatic'),
            ($17, 'Cơm Chiên Hải Sản', 'Cơm chiên hải sản với tôm, mực, cua tươi ngon đậm đà', 85000, 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400', 'https://images.pexels.com/photos/8001895/pexels-photo-8001895.jpeg?w=400,https://images.pexels.com/photos/5503717/pexels-photo-5503717.jpeg?w=400', $68, $72, 'available', 10, 125, 4.8, 125, 18, 'seafood'),
            
            -- Bánh Mì Bà Nga (Restaurant 3) - 9 foods
            ($18, 'Bánh Mì Pate', 'Bánh mì pate truyền thống Sài Gòn với pate gan, chả cua', 30000, 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400,https://images.pexels.com/photos/5503009/pexels-photo-5503009.jpeg?w=400', $69, $73, 'available', 0, 680, 4.7, 680, 5, 'street_food'),
            ($19, 'Bánh Mì Thịt Nướng', 'Bánh mì thịt nướng thơm lừng với rau thơm và nước sốt đặc biệt', 35000, 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400,https://images.pexels.com/photos/5503009/pexels-photo-5503009.jpeg?w=400', $70, $74, 'available', 0, 590, 4.5, 590, 6, 'grilled'),
            ($20, 'Bánh Cuốn Thanh Trì', 'Bánh cuốn Thanh Trì mỏng dai với nhân thịt, mộc nhĩ thơm ngon', 45000, 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400', 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400,https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', $71, $75, 'available', 10, 320, 4.8, 320, 20, 'delicate'),
            ($21, 'Nem Nướng Nha Trang', 'Nem nướng Nha Trang thơm phức với bánh tráng và rau sống', 55000, 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400', 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400,https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', $76, $80, 'available', 15, 180, 4.7, 180, 22, 'specialty'),
            ($22, 'Gỏi Cuốn Tôm Thịt', 'Gỏi cuốn tôm thịt tươi ngon với bánh tráng trong và rau thơm', 40000, 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400', 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400,https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', $77, $81, 'available', 0, 290, 4.5, 290, 8, 'fresh'),
            ($23, 'Bánh Mì Xíu Mại', 'Bánh mì xíu mại với viên thịt đậm đà và nước sốt cà chua', 32000, 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400,https://images.pexels.com/photos/5503009/pexels-photo-5503009.jpeg?w=400', $78, $82, 'available', 0, 450, 4.4, 450, 7, 'comfort'),
            ($24, 'Bánh Mì Gà Nướng', 'Bánh mì gà nướng mật ong với thịt gà thơm ngon', 38000, 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', 'https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400,https://images.pexels.com/photos/5503009/pexels-photo-5503009.jpeg?w=400', $79, $83, 'available', 0, 380, 4.6, 380, 8, 'honey_glazed'),
            ($25, 'Bánh Xèo Miền Tây', 'Bánh xèo giòn rụm với tôm, thịt, giá đỗ và rau sống', 58000, 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400', 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400,https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', $84, $88, 'available', 0, 210, 4.7, 210, 25, 'crispy'),
            ($26, 'Chả Cá Lã Vọng', 'Chả cá Lã Vọng truyền thống với cá lăng, thì là và bún', 75000, 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400', 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400,https://images.pexels.com/photos/6210959/pexels-photo-6210959.jpeg?w=400', $85, $89, 'available', 20, 95, 4.9, 95, 30, 'hanoi_specialty'),
            
            -- Chè Cung Đình (Restaurant 4) - 9 foods
            ($27, 'Chè Ba Màu', 'Chè ba màu truyền thống với đậu xanh, khoai môn, thạch', 35000, 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400', 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400,https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=400', $86, $90, 'available', 0, 280, 4.4, 280, 8, 'colorful'),
            ($28, 'Chè Thái', 'Chè Thái với nhiều loại topping đậu, thạch, sương sáo', 40000, 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400', 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400,https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=400', $87, $91, 'available', 0, 350, 4.3, 350, 10, 'mixed'),
            ($29, 'Bánh Flan', 'Bánh flan mềm mịn, ngọt ngào với caramel đậm đà', 30000, 'https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=400', 'https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=400,https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400', $92, $96, 'available', 0, 420, 4.6, 420, 12, 'creamy'),
            ($30, 'Chè Đậu Đỏ', 'Chè đậu đỏ nóng hổi với nước cốt dừa thơm béo', 32000, 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400', 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400,https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=400', $93, $97, 'available', 0, 180, 4.2, 180, 15, 'warm'),
            ($31, 'Cà Phê Sữa Đá', 'Cà phê sữa đá truyền thống Việt Nam pha phin thơm đậm', 25000, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=400', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=400,https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?w=400', $94, $98, 'available', 0, 850, 4.6, 850, 3, 'classic'),
            ($32, 'Trà Đá Chanh', 'Trà đá chanh tươi mát giải khát ngày nóng Sài Gòn', 20000, 'https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?w=400', 'https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?w=400,https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=400', $95, $99, 'available', 0, 650, 4.3, 650, 2, 'refreshing'),
            ($33, 'Chè Cung Đình', 'Chè cung đình đặc biệt với long nhãn, hạt sen, nha đam', 45000, 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400', 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400,https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=400', $100, $104, 'available', 10, 120, 4.8, 120, 18, 'royal'),
            ($34, 'Sinh Tố Bơ', 'Sinh tố bơ béo ngậy với sữa đặc và đá viên mát lạnh', 35000, 'https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?w=400', 'https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?w=400,https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=400', $101, $105, 'available', 0, 290, 4.5, 290, 5, 'creamy'),
            ($35, 'Chè Sầu Riêng', 'Chè sầu riêng thơm ngon với sầu riêng tươi và nước cốt dừa', 48000, 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400', 'https://images.pexels.com/photos/8001867/pexels-photo-8001867.jpeg?w=400,https://images.pexels.com/photos/4668274/pexels-photo-4668274.jpeg?w=400', $102, $106, 'available', 0, 85, 4.7, 85, 20, 'durian')
            ON CONFLICT ("id") DO NOTHING
        `, [
            // Food IDs (35 parameters: $1-$35)
            ...this.foodIds,
            // Category IDs (8 parameters: $36-$43)
            ...this.categoryIds,
            // Restaurant IDs (4 parameters: $44-$47)
            ...this.restaurantIds,
            // Repeat category IDs for foods 9-17 ($48-$55)
            ...this.categoryIds,
            // Repeat restaurant IDs for foods 9-17 ($56-$59)
            ...this.restaurantIds,
            // Repeat category IDs for foods 18-26 ($60-$67)
            ...this.categoryIds,
            // Repeat restaurant IDs for foods 18-26 ($68-$71)
            ...this.restaurantIds,
            // Repeat category IDs for foods 27-35 ($72-$79)
            ...this.categoryIds,
            // Repeat restaurant IDs for foods 27-35 ($80-$83)
            ...this.restaurantIds
        ]);

        // 8. Insert Promotions with proper promotion images
        await queryRunner.query(`
            INSERT INTO "promotions" ("id", "description", "discountPercent", "code", "image", "start_date", "end_date", "number_of_used", "max_usage", "type", "discountAmount", "minOrderValue", "maxDiscountAmount") VALUES
            ($1, 'Giảm 15% cho đơn hàng đầu tiên', 15, 'FIRST15', 'https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?w=400', '2025-01-01', '2025-12-31', 0, 1000, 'FOOD_DISCOUNT', NULL, 50000, 50000),
            ($2, 'Miễn phí ship cho đơn từ 200k', 0, 'FREESHIP200', 'https://images.pexels.com/photos/4393021/pexels-photo-4393021.jpeg?w=400', '2025-01-01', '2025-12-31', 0, NULL, 'SHIPPING_DISCOUNT', 25000, 200000, 25000),
            ($3, 'Giảm 20% tối đa 100k cho đơn từ 300k', 20, 'SAVE20', 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg?w=400', '2025-01-01', '2025-06-30', 0, 500, 'FOOD_DISCOUNT', NULL, 300000, 100000)
            ON CONFLICT ("id") DO NOTHING
        `, this.promoIds);

        // 9. Insert Sample Orders
        await queryRunner.query(`
            INSERT INTO "orders" ("id", "user_id", "restaurant_id", "total", "note", "status", "date", "address_id", "paymentMethod", "isPaid") VALUES
            ($1, $5, $9, 150000, 'Không hành', 'completed', '2025-07-05', $13, 'cash', true),
            ($2, $6, $10, 200000, 'Ít cay', 'completed', '2025-07-04', $14, 'vnpay', true),
            ($3, $7, $11, 80000, '', 'delivering', '2025-07-06', $15, 'cash', false),
            ($4, $8, $12, 120000, 'Thêm đá', 'pending', '2025-07-06', $16, 'momo', false)
            ON CONFLICT ("id") DO NOTHING
        `, [
            this.orderIds[0], this.orderIds[1], this.orderIds[2], this.orderIds[3],
            this.userIds[4], this.userIds[4], this.userIds[4], this.userIds[4],
            this.restaurantIds[0], this.restaurantIds[1], this.restaurantIds[2], this.restaurantIds[3],
            this.addressIds[4], this.addressIds[4], this.addressIds[4], this.addressIds[4]
        ]);

        // 10. Insert Order Details
        await queryRunner.query(`
            INSERT INTO "orderDetails" ("id", "quantity", "price", "note", "order_id", "food_id") VALUES
            ($1, 2, '75000', 'Ít hành', $2, $3),
            ($4, 1, '70000', '', $5, $6),
            ($7, 3, '65000', 'Thêm chả', $8, $9),
            ($10, 1, '68000', '', $11, $12),
            ($13, 2, '30000', '', $14, $15),
            ($16, 1, '35000', 'Ít cay', $17, $18),
            ($19, 1, '35000', '', $20, $21),
            ($22, 2, '40000', 'Nhiều đá', $23, $24)
            ON CONFLICT ("id") DO NOTHING
        `, [
            this.orderDetailIds[0], this.orderIds[0], this.foodIds[0],
            this.orderDetailIds[1], this.orderIds[0], this.foodIds[1],
            this.orderDetailIds[2], this.orderIds[1], this.foodIds[8],
            this.orderDetailIds[3], this.orderIds[1], this.foodIds[9],
            this.orderDetailIds[4], this.orderIds[2], this.foodIds[17],
            this.orderDetailIds[5], this.orderIds[2], this.foodIds[18],
            this.orderDetailIds[6], this.orderIds[3], this.foodIds[26],
            this.orderDetailIds[7], this.orderIds[3], this.foodIds[27]
        ]);

        // 11. Insert Vietnamese Reviews with proper food images
        await queryRunner.query(`
            INSERT INTO "reviews" ("id", "rating", "comment", "image", "type", "user_id", "food_id", "createdAt") VALUES
            ($1, 5, 'Phở rất ngon! Nước dùng đậm đà, thịt bò tươi ngon. Quán phục vụ nhiệt tình, sẽ quay lại.', 'https://images.pexels.com/photos/8878834/pexels-photo-8878834.jpeg?w=400', 'food', $2, $3, NOW()),
            ($4, 4, 'Cơm tấm sườn nướng thơm ngon, chả trứng béo ngậy. Giá cả hợp lý cho chất lượng.', NULL, 'food', $5, $6, NOW()),
            ($7, 5, 'Bánh mì pate ngon, bánh giòn, nhân đầy đặn. Giao hàng nhanh chóng.', NULL, 'food', $8, $9, NOW()),
            ($10, 4, 'Chè ba màu đẹp mắt, ngọt vừa miệng. Đậu xanh mềm, thạch mát lạnh.', NULL, 'food', $11, $12, NOW()),
            ($13, 5, 'Bún bò Huế cay vừa phải, nước dùng thơm ngon. Thịt bò mềm, chả cua tươi.', 'https://images.pexels.com/photos/8001922/pexels-photo-8001922.jpeg?w=400', 'food', $14, $15, NOW()),
            ($16, 4, 'Nem nướng Nha Trang thơm phức, bánh tráng mỏng dai. Nước chấm đậm đà.', NULL, 'food', $17, $18, NOW()),
            ($19, 5, 'Cà phê sữa đá đúng vị truyền thống! Đậm đà thơm ngon, giá rẻ nữa.', NULL, 'food', $20, $21, NOW()),
            ($22, 4, 'Phở gà nước dùng trong veo, thịt gà mềm ngọt. Bánh phở dai ngon.', NULL, 'food', $23, $24, NOW()),
            ($25, 5, 'Bún chả Hà Nội ngon tuyệt vời! Thịt nướng thơm, nước chấm chua ngọt vừa miệng.', NULL, 'food', $26, $27, NOW()),
            ($28, 4, 'Cơm chiên Dương Châu đầy đặn, tôm tươi ngon, cơm dẻo vừa phải.', NULL, 'food', $29, $30, NOW()),
            ($31, 5, 'Bánh xèo giòn rụm, nhân đầy đặn. Ăn kèm rau sống rất ngon.', 'https://images.pexels.com/photos/4051268/pexels-photo-4051268.jpeg?w=400', 'food', $32, $33, NOW()),
            ($34, 4, 'Chè cung đình sang trọng, vị ngọt thanh tao. Trình bày đẹp mắt.', NULL, 'food', $35, $36, NOW())
            ON CONFLICT ("id") DO NOTHING
        `, [
            // 12 review IDs + 12 user IDs + 12 food IDs = 36 parameters
            this.reviewIds[0], this.userIds[4], this.foodIds[0],
            this.reviewIds[1], this.userIds[4], this.foodIds[8], 
            this.reviewIds[2], this.userIds[4], this.foodIds[17],
            this.reviewIds[3], this.userIds[4], this.foodIds[26],
            this.reviewIds[4], this.userIds[4], this.foodIds[2],
            this.reviewIds[5], this.userIds[4], this.foodIds[20],
            this.reviewIds[6], this.userIds[4], this.foodIds[30],
            this.reviewIds[7], this.userIds[4], this.foodIds[1],
            this.reviewIds[8], this.userIds[4], this.foodIds[3],
            this.reviewIds[9], this.userIds[4], this.foodIds[10],
            this.reviewIds[10], this.userIds[4], this.foodIds[24],
            this.reviewIds[11], this.userIds[4], this.foodIds[32]
        ]);
        console.log('✅ Vietnamese sample data with 35 foods inserted successfully!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "reviews" WHERE id IN (${this.reviewIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.reviewIds);
        await queryRunner.query(`DELETE FROM "orderDetails" WHERE id IN (${this.orderDetailIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.orderDetailIds);
        await queryRunner.query(`DELETE FROM "orders" WHERE id IN (${this.orderIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.orderIds);
        await queryRunner.query(`DELETE FROM "promotions" WHERE id IN (${this.promoIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.promoIds);
        await queryRunner.query(`DELETE FROM "foods" WHERE id IN (${this.foodIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.foodIds);
        await queryRunner.query(`DELETE FROM "restaurants" WHERE id IN (${this.restaurantIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.restaurantIds);
        await queryRunner.query(`DELETE FROM "categories" WHERE id IN (${this.categoryIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.categoryIds);
        await queryRunner.query(`DELETE FROM "shipperCertificateInfos" WHERE id IN (${this.shipperCertIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.shipperCertIds);
        await queryRunner.query(`DELETE FROM "users" WHERE id IN (${this.userIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.userIds);
        await queryRunner.query(`DELETE FROM "address" WHERE id IN (${this.addressIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.addressIds);
    }
}