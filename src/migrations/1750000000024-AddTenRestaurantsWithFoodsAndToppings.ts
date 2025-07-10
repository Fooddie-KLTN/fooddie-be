import { MigrationInterface, QueryRunner } from "typeorm";
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export class AddTenRestaurantsWithFoodsAndToppings1750000000024 implements MigrationInterface {
    name = 'AddTenRestaurantsWithFoodsAndToppings1750000000024';

    // Generate IDs for the new data
    private readonly newAddressIds = Array.from({ length: 10 }, () => uuidv4());
    private readonly newUserIds = Array.from({ length: 10 }, () => uuidv4().substring(0, 28));
    private readonly newRestaurantIds = Array.from({ length: 10 }, () => uuidv4());
    private readonly newFoodIds = Array.from({ length: 50 }, () => uuidv4()); // 10 restaurants * 5 foods each
    private readonly newToppingIds = Array.from({ length: 100 }, () => uuidv4()); // 50 foods * 2 toppings each

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Get existing role ID for shop_owner
        const shopOwnerRoleRes = await queryRunner.query(`SELECT id FROM "roles" WHERE name = 'shop_owner' LIMIT 1`);
        const shopOwnerRoleId = shopOwnerRoleRes[0]?.id;

        // Get existing category IDs (assuming they exist from previous migration)
        const categoryRes = await queryRunner.query(`SELECT id FROM "categories" ORDER BY name LIMIT 8`);
        const categoryIds = categoryRes.map(c => c.id);

        // Hash passwords for new users
        const hashedPasswords = await Promise.all(
            Array.from({ length: 10 }, () => bcrypt.hash('password123', 10))
        );

        // 1. Insert new addresses for restaurants
        await queryRunner.query(`
            INSERT INTO "address" ("id", "street", "ward", "district", "city", "latitude", "longitude", "isDefault") VALUES
            ($1, '15 Đường Số 1', 'Phường Bình Thuận', 'Quận 7', 'Thành phố Hồ Chí Minh', 10.7350, 106.7200, false),
            ($2, '88 Hoàng Diệu', 'Phường 12', 'Quận 4', 'Thành phố Hồ Chí Minh', 10.7580, 106.7050, false),
            ($3, '125 Nguyễn Thị Minh Khai', 'Phường Đa Kao', 'Quận 1', 'Thành phố Hồ Chí Minh', 10.7890, 106.7020, false),
            ($4, '99 Lê Lợi', 'Phường Bến Thành', 'Quận 1', 'Thành phố Hồ Chí Minh', 10.7740, 106.7000, false),
            ($5, '77 Pasteur', 'Phường Nguyễn Thái Bình', 'Quận 1', 'Thành phố Hồ Chí Minh', 10.7690, 106.6980, false),
            ($6, '168 Nguyễn Văn Cừ', 'Phường Nguyễn Cư Trinh', 'Quận 1', 'Thành phố Hồ Chí Minh', 10.7560, 106.6850, false),
            ($7, '250 Võ Văn Tần', 'Phường 5', 'Quận 3', 'Thành phố Hồ Chí Minh', 10.7820, 106.6920, false),
            ($8, '33 Cao Thắng', 'Phường 12', 'Quận 10', 'Thành phố Hồ Chí Minh', 10.7720, 106.6740, false),
            ($9, '45 Điện Biên Phủ', 'Phường Đa Kao', 'Quận 1', 'Thành phố Hồ Chí Minh', 10.7810, 106.6950, false),
            ($10, '222 Nguyễn Đình Chiểu', 'Phường 6', 'Quận 3', 'Thành phố Hồ Chí Minh', 10.7900, 106.6880, false)
            ON CONFLICT ("id") DO NOTHING
        `, this.newAddressIds);

        // 2. Insert new restaurant owners
        await queryRunner.query(`
            INSERT INTO "users" ("id", "username", "password", "email", "role_id", "name", "phone", "birthday", "avatar", "authProvider", "is_active") VALUES
            ($1, 'chubep5', $11, 'chubep5@fooddie.com', $21, 'Nguyễn Văn Khôi - Chủ Quán Pizza', '0901234573', '1986-04-20', $31, 'email', true),
            ($2, 'chubep6', $12, 'chubep6@fooddie.com', $22, 'Lê Thị Lan - Chủ Quán Burger', '0901234574', '1988-09-15', $32, 'email', true),
            ($3, 'chubep7', $13, 'chubep7@fooddie.com', $23, 'Trần Minh Tuấn - Chủ Quán Sushi', '0901234575', '1985-11-30', $33, 'email', true),
            ($4, 'chubep8', $14, 'chubep8@fooddie.com', $24, 'Phạm Thị Hoa - Chủ Quán Lẩu Thái', '0901234576', '1987-06-12', $34, 'email', true),
            ($5, 'chubep9', $15, 'chubep9@fooddie.com', $25, 'Vũ Đình Nam - Chủ Quán BBQ', '0901234577', '1989-02-25', $35, 'email', true),
            ($6, 'chubep10', $16, 'chubep10@fooddie.com', $26, 'Hoàng Thị Mai - Chủ Quán Dimsum', '0901234578', '1986-08-18', $36, 'email', true),
            ($7, 'chubep11', $17, 'chubep11@fooddie.com', $27, 'Đặng Văn Hùng - Chủ Quán Hotpot', '0901234579', '1984-12-05', $37, 'email', true),
            ($8, 'chubep12', $18, 'chubep12@fooddie.com', $28, 'Bùi Thị Linh - Chủ Quán Pasta', '0901234580', '1990-03-14', $38, 'email', true),
            ($9, 'chubep13', $19, 'chubep13@fooddie.com', $29, 'Cao Minh Đức - Chủ Quán Taco', '0901234581', '1988-07-22', $39, 'email', true),
            ($10, 'chubep14', $20, 'chubep14@fooddie.com', $30, 'Ngô Thị Thủy - Chủ Quán Salad', '0901234582', '1991-01-08', $40, 'email', true)
            ON CONFLICT ("id") DO NOTHING
        `, [
            // User IDs (1-10)
            ...this.newUserIds,
            // Hashed passwords (11-20)
            ...hashedPasswords,
            // Role IDs (21-30)
            ...Array(10).fill(shopOwnerRoleId),
            // Avatar URLs (31-40)
            ...this.newUserIds.map(id => `https://testingbot.com/free-online-tools/random-avatar/128?u=${id}`)
        ]);

        // 3. Insert new restaurants
        await queryRunner.query(`
            INSERT INTO "restaurants" ("id", "name", "description", "avatar", "backgroundImage", "phoneNumber", "certificateImage", "addressId", "owner_id", "status", "latitude", "longitude", "openTime", "closeTime", "licenseCode") VALUES
            ($1, 'Pizza Amore', 'Nhà hàng Pizza Ý chính thống với lò nướng than hoa và nguyên liệu nhập khẩu từ Ý', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200', '02812345682', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $11, $21, 'approved', $31, $32, '10:00', '23:00', 'REST005VN'),
            ($2, 'Burger House', 'Chuỗi burger Mỹ với thịt bò Angus tươi ngon và bánh mì tự làm hàng ngày', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200', '02812345683', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $12, $22, 'approved', $33, $34, '09:00', '22:30', 'REST006VN'),
            ($3, 'Tokyo Sushi', 'Nhà hàng Nhật Bản chuyên sushi và sashimi với đầu bếp người Nhật', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200', '02812345684', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $13, $23, 'approved', $35, $36, '11:00', '22:00', 'REST007VN'),
            ($4, 'Lẩu Thái Cay', 'Nhà hàng Thái Lan chuyên lẩu Tom Yum và các món ăn cay nồng đặc trưng', 'https://images.unsplash.com/photo-1559847844-d90eb7b78f5c?w=500', 'https://images.unsplash.com/photo-1559847844-d90eb7b78f5c?w=1200', '02812345685', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $14, $24, 'approved', $37, $38, '16:00', '24:00', 'REST008VN'),
            ($5, 'Seoul BBQ', 'Nhà hàng Hàn Quốc chuyên thịt nướng và các món ăn truyền thống Hàn Quốc', 'https://images.unsplash.com/photo-1535473895227-bdab6e7bb930?w=500', 'https://images.unsplash.com/photo-1535473895227-bdab6e7bb930?w=1200', '02812345686', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $15, $25, 'approved', $39, $40, '17:00', '02:00', 'REST009VN'),
            ($6, 'Hong Kong Dimsum', 'Nhà hàng Hồng Kông chuyên các món dimsum và trà Trung Hoa', 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=500', 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=1200', '02812345687', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $16, $26, 'approved', $41, $42, '06:00', '15:00', 'REST010VN'),
            ($7, 'Hotpot Paradise', 'Nhà hàng lẩu Trung Hoa với nhiều loại nước lèo và topping cao cấp', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=1200', '02812345688', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $17, $27, 'approved', $43, $44, '16:30', '23:30', 'REST011VN'),
            ($8, 'Pasta Milano', 'Nhà hàng Ý chuyên các loại pasta tươi và sốt Ý truyền thống', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500', 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=1200', '02812345689', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $18, $28, 'approved', $45, $46, '11:30', '21:30', 'REST012VN'),
            ($9, 'Taco Fiesta', 'Nhà hàng Mexico chuyên taco và các món ăn Mexico chính thống', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=1200', '02812345690', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $19, $29, 'approved', $47, $48, '10:30', '22:00', 'REST013VN'),
            ($10, 'Green Salad', 'Nhà hàng chuyên salad và các món ăn healthy cho người ăn kiêng', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200', '02812345691', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', $20, $30, 'approved', $49, $50, '08:00', '20:00', 'REST014VN')
            ON CONFLICT ("id") DO NOTHING
        `, [
            // Restaurant IDs (1-10)
            ...this.newRestaurantIds,
            // Address IDs (11-20)
            ...this.newAddressIds,
            // Owner IDs (21-30)
            ...this.newUserIds,
            // Coordinates (31-50)
            10.7350, 106.7200, 10.7580, 106.7050, 10.7890, 106.7020, 10.7740, 106.7000, 10.7690, 106.6980,
            10.7560, 106.6850, 10.7820, 106.6920, 10.7720, 106.6740, 10.7810, 106.6950, 10.7900, 106.6880
        ]);

        // 4. Insert foods for each restaurant (5 foods per restaurant)
        const foodInserts = [];
        const foodParams: any[] = []; // Add explicit type annotation
        let paramIndex = 1;

        // Restaurant 1: Pizza Amore
        const restaurant1Foods = [
            ['Pizza Margherita', 'Pizza Margherita truyền thống với cà chua San Marzano, mozzarella tươi và húng quế', 180000, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400'],
            ['Pizza Pepperoni', 'Pizza Pepperoni với xúc xích pepperoni cay nồng và phô mai mozzarella', 220000, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400'],
            ['Pizza Quattro Stagioni', 'Pizza bốn mùa với nấm, ham, artichoke và olive', 250000, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'],
            ['Pizza Diavola', 'Pizza cay với salami cay, ớt jalapeño và phô mai', 240000, 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400'],
            ['Pizza Vegetarian', 'Pizza chay với cà tím, zucchini, ớt chuông và pesto', 200000, 'https://images.unsplash.com/photo-1564128442383-9201fcc740eb?w=400']
        ];

        // Restaurant 2: Burger House  
        const restaurant2Foods = [
            ['Classic Beef Burger', 'Burger bò Angus cổ điển với rau xanh, cà chua và sốt burger', 150000, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'],
            ['Cheese Burger Deluxe', 'Burger phô mai cao cấp với thịt bò và 3 loại phô mai', 180000, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400'],
            ['Chicken Burger', 'Burger gà chiên giòn với salad và sốt mayo', 140000, 'https://images.unsplash.com/photo-1606755962773-d324e9a13086?w=400'],
            ['Fish Burger', 'Burger cá hồi nướng với rau xanh và sốt tartar', 160000, 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400'],
            ['Veggie Burger', 'Burger chay với patty từ đậu và rau củ', 130000, 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400']
        ];

        // Restaurant 3: Tokyo Sushi
        const restaurant3Foods = [
            ['Sushi Combo A', 'Combo sushi gồm 8 miếng sushi cá hồi, cá ngừ và tôm', 280000, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400'],
            ['Sashimi Premium', 'Sashimi cao cấp với cá hồi, cá ngừ đại dương tươi', 350000, 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400'],
            ['Chirashi Bowl', 'Cơm sashimi với nhiều loại cá tươi và rau củ', 320000, 'https://images.unsplash.com/photo-1582450871972-ab5ca1957163?w=400'],
            ['Maki Set', 'Set cuốn maki với cá hồi, cá ngừ và rau củ', 250000, 'https://images.unsplash.com/photo-1576675466766-f7e1c7e0a5d0?w=400'],
            ['Tempura Udon', 'Udon với tôm tempura và nước dashi đậm đà', 180000, 'https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=400']
        ];

        // Restaurant 4: Lẩu Thái Cay
        const restaurant4Foods = [
            ['Lẩu Tom Yum', 'Lẩu Tom Yum cay nồng với tôm, nấm và lá chanh', 380000, 'https://images.unsplash.com/photo-1559847844-d90eb7b78f5c?w=400'],
            ['Pad Thai', 'Pad Thai truyền thống với tôm, trứng và đậu phộng', 150000, 'https://images.unsplash.com/photo-1559314809-0f31657d96c0?w=400'],
            ['Som Tam', 'Gỏi đu đủ Thái Lan cay chua với cà chua và đậu phộng', 120000, 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400'],
            ['Massaman Curry', 'Cà ri Massaman với thịt bò và khoai tây', 180000, 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400'],
            ['Mango Sticky Rice', 'Xôi xoài Thái Lan với nước cốt dừa', 80000, 'https://images.unsplash.com/photo-1561048103-1d4a9c8f3a1c?w=400']
        ];

        // Restaurant 5: Seoul BBQ
        const restaurant5Foods = [
            ['Bulgogi Set', 'Set thịt bò nướng Bulgogi với kimchi và cơm', 280000, 'https://images.unsplash.com/photo-1535473895227-bdab6e7bb930?w=400'],
            ['Galbi BBQ', 'Sườn bò nướng Galbi với sốt đặc biệt', 350000, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'],
            ['Bibimbap', 'Cơm trộn Hàn Quốc với rau củ và thịt bò', 160000, 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400'],
            ['Kimchi Jjigae', 'Canh kimchi với thịt heo và đậu phụ', 140000, 'https://images.unsplash.com/photo-1584503784915-46c2b3d1f8b4?w=400'],
            ['Korean Fried Chicken', 'Gà chiên Hàn Quốc với sốt cay ngọt', 200000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400']
        ];

        // Restaurant 6: Hong Kong Dimsum
        const restaurant6Foods = [
            ['Har Gow', 'Há cảo tôm trong vỏ bánh mỏng dai', 120000, 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400'],
            ['Siu Mai', 'Siu mai thịt heo với trứng cút', 100000, 'https://images.unsplash.com/photo-1587073677146-36c2a6595d17?w=400'],
            ['Char Siu Bao', 'Bánh bao xá xíu nướng thơm ngon', 90000, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400'],
            ['Cheung Fun', 'Bánh cuốn phô mai và tôm', 110000, 'https://images.unsplash.com/photo-1587564171153-6b5e5e2e2ae5?w=400'],
            ['Egg Tart', 'Bánh tart trứng Hong Kong', 60000, 'https://images.unsplash.com/photo-1563379091339-03246963d21a?w=400']
        ];

        // Restaurant 7: Hotpot Paradise
        const restaurant7Foods = [
            ['Sichuan Hotpot', 'Lẩu Tứ Xuyên cay nồng với nước lèo đặc biệt', 420000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400'],
            ['Tomato Hotpot', 'Lẩu cà chua thanh mát với thịt bò và rau củ', 380000, 'https://images.unsplash.com/photo-1603137736717-f8b2d2b5a7e6?w=400'],
            ['Mushroom Hotpot', 'Lẩu nấm với nhiều loại nấm cao cấp', 360000, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400'],
            ['Seafood Hotpot', 'Lẩu hải sản với tôm, cua, mực tươi', 480000, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400'],
            ['Vegetarian Hotpot', 'Lẩu chay với đậu phụ và rau củ', 280000, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400']
        ];

        // Restaurant 8: Pasta Milano
        const restaurant8Foods = [
            ['Spaghetti Carbonara', 'Spaghetti Carbonara với bacon và phô mai Parmesan', 180000, 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400'],
            ['Fettuccine Alfredo', 'Fettuccine với sốt kem Alfredo đậm đà', 170000, 'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=400'],
            ['Penne Arrabbiata', 'Penne với sốt cà chua cay và tỏi', 160000, 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=400'],
            ['Lasagna Bolognese', 'Lasagna với sốt thịt bò Bolognese', 220000, 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400'],
            ['Gnocchi Pesto', 'Gnocchi với sốt pesto tươi', 190000, 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400']
        ];

        // Restaurant 9: Taco Fiesta
        const restaurant9Foods = [
            ['Beef Tacos', 'Taco thịt bò với rau xanh và sốt salsa', 140000, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400'],
            ['Chicken Quesadilla', 'Quesadilla gà với phô mai và ớt jalapeño', 160000, 'https://images.unsplash.com/photo-1565299585323-38174c4a6663?w=400'],
            ['Fish Tacos', 'Taco cá với bắp cải và sốt chipotle', 150000, 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400'],
            ['Burrito Bowl', 'Burrito bowl với thịt bò, gạo và đậu đen', 180000, 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400'],
            ['Nachos Supreme', 'Nachos với phô mai, thịt bò và guacamole', 120000, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400']
        ];

        // Restaurant 10: Green Salad
        const restaurant10Foods = [
            ['Caesar Salad', 'Salad Caesar với gà nướng và phô mai Parmesan', 140000, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400'],
            ['Greek Salad', 'Salad Hy Lạp với phô mai feta và olive', 130000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400'],
            ['Quinoa Power Bowl', 'Bowl quinoa với avocado và rau củ', 160000, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400'],
            ['Salmon Salad', 'Salad cá hồi nướng với rau xanh', 220000, 'https://images.unsplash.com/photo-1559847844-d90eb7b78f5c?w=400'],
            ['Vegan Buddha Bowl', 'Buddha bowl chay với nhiều loại rau củ', 150000, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400']
        ];

        const allFoods = [
            restaurant1Foods, restaurant2Foods, restaurant3Foods, restaurant4Foods, restaurant5Foods,
            restaurant6Foods, restaurant7Foods, restaurant8Foods, restaurant9Foods, restaurant10Foods
        ];

        // Build food insert query
        let foodParamIndex = 1;
        const foodValues: string[] = [];
        
        allFoods.forEach((restaurantFoods, restaurantIndex) => {
            restaurantFoods.forEach((food, foodIndex) => {
                const foodId = this.newFoodIds[restaurantIndex * 5 + foodIndex];
                const restaurantId = this.newRestaurantIds[restaurantIndex];
                const categoryId = categoryIds[restaurantIndex % categoryIds.length];
                
                foodValues.push(
                    `($${foodParamIndex}, $${foodParamIndex + 1}, $${foodParamIndex + 2}, $${foodParamIndex + 3}, $${foodParamIndex + 4}, $${foodParamIndex + 5}, $${foodParamIndex + 6}, $${foodParamIndex + 7}, $${foodParamIndex + 8}, $${foodParamIndex + 9}, $${foodParamIndex + 10}, $${foodParamIndex + 11}, $${foodParamIndex + 12}, $${foodParamIndex + 13}, $${foodParamIndex + 14})`
                );
                
                foodParams.push(
                    foodId,                           // id
                    food[0],                          // name
                    food[1],                          // description
                    food[2],                          // price
                    food[3],                          // image
                    food[3],                          // image_urls
                    categoryId,                       // category_id
                    restaurantId,                     // restaurant_id
                    'available',                      // status
                    0,                                // discount_percent
                    Math.floor(Math.random() * 100),  // sold_count
                    (4 + Math.random()).toFixed(1),   // rating
                    Math.floor(Math.random() * 100),  // purchased_number
                    15 + Math.floor(Math.random() * 20), // preparation_time
                    'new'                             // tag
                );
                
                foodParamIndex += 15;
            });
        });

        await queryRunner.query(`
            INSERT INTO "foods" ("id", "name", "description", "price", "image", "image_urls", "category_id", "restaurant_id", "status", "discount_percent", "sold_count", "rating", "purchased_number", "preparation_time", "tag") VALUES
            ${foodValues.join(', ')}
            ON CONFLICT ("id") DO NOTHING
        `, foodParams);

        // 5. Insert toppings for each food (2 toppings per food)
        const toppingInserts: string[] = []; // Add explicit type annotation
        const toppingParams: any[] = [];     // Add explicit type annotation
        let toppingParamIndex = 1;

        const commonToppings = [
            ['Extra Cheese', 15000], ['Extra Meat', 25000], ['Extra Vegetables', 10000], ['Extra Sauce', 5000],
            ['Mushrooms', 12000], ['Onions', 8000], ['Peppers', 10000], ['Avocado', 20000],
            ['Bacon', 30000], ['Egg', 15000], ['Spicy Sauce', 8000], ['Garlic', 5000],
            ['Herbs', 8000], ['Pickles', 10000], ['Tomatoes', 8000], ['Lettuce', 5000]
        ];

        this.newFoodIds.forEach((foodId, index) => {
            // Get 2 random toppings for each food
            const foodToppings = [
                commonToppings[index % commonToppings.length],
                commonToppings[(index + 1) % commonToppings.length]
            ];

            foodToppings.forEach((topping, toppingIndex) => {
                const toppingId = this.newToppingIds[index * 2 + toppingIndex];
                
                toppingInserts.push(
                    `($${toppingParamIndex}, $${toppingParamIndex + 1}, $${toppingParamIndex + 2}, $${toppingParamIndex + 3}, $${toppingParamIndex + 4})`
                );
                
                toppingParams.push(
                    toppingId,      // id
                    topping[0],     // name
                    topping[1],     // price
                    true,           // isAvailable
                    foodId          // food_id
                );
                
                toppingParamIndex += 5;
            });
        });

        await queryRunner.query(`
            INSERT INTO "toppings" ("id", "name", "price", "isAvailable", "food_id") VALUES
            ${toppingInserts.join(', ')}
            ON CONFLICT ("id") DO NOTHING
        `, toppingParams);

        console.log('✅ Successfully inserted 10 new restaurants with 5 foods each and 2 toppings per food!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete in reverse order to maintain foreign key constraints
        await queryRunner.query(`DELETE FROM "toppings" WHERE id IN (${this.newToppingIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.newToppingIds);
        await queryRunner.query(`DELETE FROM "foods" WHERE id IN (${this.newFoodIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.newFoodIds);
        await queryRunner.query(`DELETE FROM "restaurants" WHERE id IN (${this.newRestaurantIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.newRestaurantIds);
        await queryRunner.query(`DELETE FROM "users" WHERE id IN (${this.newUserIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.newUserIds);
        await queryRunner.query(`DELETE FROM "address" WHERE id IN (${this.newAddressIds.map((_, i) => `$${i + 1}`).join(', ')})`, this.newAddressIds);
        
        console.log('✅ Successfully removed 10 restaurants and related data!');
    }
}