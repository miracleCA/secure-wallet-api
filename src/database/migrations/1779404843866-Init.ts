import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1779404843866 implements MigrationInterface {
    name = 'Init1779404843866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_a88f466d39796d3081cf96e1b66\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`walletId\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`walletId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_a88f466d39796d3081cf96e1b66\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_a88f466d39796d3081cf96e1b66\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`walletId\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`walletId\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_a88f466d39796d3081cf96e1b66\` FOREIGN KEY (\`walletId\`) REFERENCES \`wallets\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
