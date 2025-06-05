import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const standardGroups = [
  "user", "role", "permission", "restaurant", "food",
  "order", "promotion", "category", "payment", "review"
];
const operations = ["CREATE", "READ", "UPDATE", "DELETE", "LIST"];

export class SeedAdminAndRoles1748968581909 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Seed Permissions
    for (const group of standardGroups) {
      for (const operation of operations) {
        const name = `${group.toUpperCase()}_${operation}`;
        await queryRunner.query(
          `INSERT INTO "permissions" ("name", "description", "is_active") 
           VALUES ($1, $2, true)
           ON CONFLICT ("name") DO NOTHING`,
          [name, `Permission to ${operation.toLowerCase()} ${group}`]
        );
      }
    }

    // 2. Seed Roles
    await queryRunner.query(
      `INSERT INTO "roles" ("name", "display_name", "description", "is_system") 
       VALUES ('super_admin', 'Super Administrator', 'Full system access with all permissions', true)
       ON CONFLICT ("name") DO NOTHING`
    );
    await queryRunner.query(
      `INSERT INTO "roles" ("name", "display_name", "description", "is_system") 
       VALUES ('administrator', 'Administrator', 'Restaurant system administration', true)
       ON CONFLICT ("name") DO NOTHING`
    );
    await queryRunner.query(
      `INSERT INTO "roles" ("name", "display_name", "description", "is_system") 
       VALUES ('user', 'Standard User', 'Regular application user', true)
       ON CONFLICT ("name") DO NOTHING`
    );
    await queryRunner.query(
      `INSERT INTO "roles" ("name", "display_name", "description", "is_system") 
       VALUES ('shop_owner', 'Shop Owner', 'Manages their own restaurant and related operations', false)
       ON CONFLICT ("name") DO NOTHING`
    );
    await queryRunner.query(
      `INSERT INTO "roles" ("name", "display_name", "description", "is_system") 
       VALUES ('shipper', 'Shipper', 'shipper role with limited permissions', false)
       ON CONFLICT ("name") DO NOTHING`
    );

    // 3. Assign all permissions to super_admin (FIXED)
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'super_admin'
      ON CONFLICT DO NOTHING
    `);

    // 4. Assign permissions to administrator (FIXED)
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'administrator' AND p.name NOT LIKE 'SUPER_%'
      ON CONFLICT DO NOTHING
    `);

    // 5. Assign basic permissions to user (FIXED)
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'user' AND (
        p.name = 'USER_READ' OR
        p.name LIKE 'PROFILE_%' OR
        p.name = 'ORDER_CREATE' OR
        p.name = 'ORDER_READ' OR
        p.name = 'REVIEW_CREATE' OR
        p.name = 'RESTAURANT_READ' OR
        p.name = 'FOOD_READ'
      )
      ON CONFLICT DO NOTHING
    `);

    // 6. Assign permissions to shop_owner (FIXED)
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r, "permissions" p
      WHERE r.name = 'shop_owner' AND (
        p.name LIKE 'RESTAURANT_%' OR
        p.name LIKE 'FOOD_%' OR
        p.name = 'ORDER_READ' OR
        p.name = 'ORDER_UPDATE' OR
        p.name = 'PROMOTION_CREATE' OR
        p.name = 'PROMOTION_READ' OR
        p.name = 'PROMOTION_UPDATE' OR
        p.name = 'PROMOTION_DELETE' OR
        p.name = 'CATEGORY_READ' OR
        p.name LIKE 'PROFILE_%'
      )
      ON CONFLICT DO NOTHING
    `);

    // 7. SHIPPER role gets no permissions by default

    // 8. Create admin address if not exists
    let addressId: string | null = null;
    const addressRes = await queryRunner.query(
      `SELECT id FROM "address" WHERE street = $1 AND ward = $2 AND district = $3 AND city = $4 LIMIT 1`,
      ['Admin Street', 'Admin Ward', 'Admin District', 'Admin City']
    );
    if (addressRes.length > 0) {
      addressId = addressRes[0].id;
    } else {
      const insertRes = await queryRunner.query(
        `INSERT INTO "address" (street, ward, district, city) VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Admin Street', 'Admin Ward', 'Admin District', 'Admin City']
      );
      addressId = insertRes[0].id;
    }

    // 9. Create admin user if not exists
    const adminUserRes = await queryRunner.query(
      `SELECT id FROM "users" WHERE username = $1 LIMIT 1`,
      ['admin']
    );
    if (adminUserRes.length === 0) {
      const adminId = uuidv4().substring(0, 28);
      const hashedPassword = await bcrypt.hash('admin123', 10);

      // Get super admin role id (FIXED)
      const superAdminRoleRes = await queryRunner.query(
        `SELECT id FROM "roles" WHERE name = 'super_admin' LIMIT 1`
      );
      const superAdminRoleId = superAdminRoleRes[0].id;

      await queryRunner.query(
        `INSERT INTO "users" 
          (id, username, password, email, name, birthday, role_id, "authProvider", is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
        [
          adminId,
          'admin',
          hashedPassword,
          'adminadmin@gmail.com',
          'System Administrator',
          new Date(),
          superAdminRoleId,
          'email'
        ]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove seeded admin user
    await queryRunner.query(`DELETE FROM "users" WHERE username = 'admin'`);
    // Remove seeded roles (FIXED)
    await queryRunner.query(`DELETE FROM "roles" WHERE name IN ('super_admin', 'administrator', 'user', 'shop_owner', 'shipper')`);
    // Remove seeded permissions
    await queryRunner.query(`DELETE FROM "permissions" WHERE name IN (${[
      ...standardGroups.flatMap(group => operations.map(op => `'${group.toUpperCase()}_${op}'`))
    ].join(',')})`);
    // Optionally, remove admin address
    await queryRunner.query(
      `DELETE FROM "address" WHERE street = $1 AND ward = $2 AND district = $3 AND city = $4`,
      ['Admin Street', 'Admin Ward', 'Admin District', 'Admin City']
    );
  }
}