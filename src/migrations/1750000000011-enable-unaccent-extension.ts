import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableUnaccentExtension1750000000011 implements MigrationInterface {
    name = 'EnableUnaccentExtension1750000000011'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS unaccent`);
        console.log('Enabled unaccent extension for accent-insensitive search');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP EXTENSION IF EXISTS unaccent`);
        console.log('Disabled unaccent extension');
    }
}