import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageToPromotion1750000000000 implements MigrationInterface {
    name = 'AddImageToPromotion1750000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotions" ADD COLUMN "image" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "promotions" DROP COLUMN "image"`);
    }
}