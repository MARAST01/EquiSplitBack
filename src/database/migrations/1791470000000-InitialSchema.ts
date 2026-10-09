import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the initial EquiSplit relational schema.
 *
 * Important: this migration intentionally does not contain BEGIN/COMMIT.
 * TypeORM manages the migration transaction.
 */
export class InitialSchema1791470000000 implements MigrationInterface {
  name = 'InitialSchema1791470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "email" VARCHAR(254) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "groups" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(100) NOT NULL,
        "description" VARCHAR(500),
        "created_by_user_id" UUID NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_groups_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "group_members" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "group_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "role" VARCHAR(20) NOT NULL,
        "status" VARCHAR(20) NOT NULL,
        "joined_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "left_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_group_members_group"
          FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_group_members_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "uq_group_members_group_user" UNIQUE ("group_id", "user_id"),
        CONSTRAINT "ck_group_members_role" CHECK ("role" IN ('OWNER', 'ADMIN', 'MEMBER')),
        CONSTRAINT "ck_group_members_status" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cycles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "group_id" UUID NOT NULL,
        "name" VARCHAR(150) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "start_date" DATE NOT NULL,
        "end_date" DATE,
        "created_by_user_id" UUID NOT NULL,
        "closed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_cycles_group"
          FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_cycles_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_cycles_status" CHECK ("status" IN ('OPEN', 'CLOSED')),
        CONSTRAINT "ck_cycles_dates" CHECK ("end_date" IS NULL OR "end_date" >= "start_date"),
        CONSTRAINT "uq_cycles_id_group" UNIQUE ("id", "group_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cycle_members" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "cycle_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_cycle_members_cycle"
          FOREIGN KEY ("cycle_id") REFERENCES "cycles" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_cycle_members_user"
          FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "uq_cycle_members_cycle_user" UNIQUE ("cycle_id", "user_id"),
        CONSTRAINT "uq_cycle_members_id_cycle" UNIQUE ("id", "cycle_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "incomes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "cycle_member_id" UUID NOT NULL,
        "type" VARCHAR(20) NOT NULL,
        "amount" BIGINT NOT NULL,
        "description" VARCHAR(255),
        "income_date" DATE NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_incomes_cycle_member"
          FOREIGN KEY ("cycle_member_id") REFERENCES "cycle_members" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_incomes_type" CHECK ("type" IN ('FIXED', 'VARIABLE')),
        CONSTRAINT "ck_incomes_amount" CHECK ("amount" > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "expenses" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "cycle_id" UUID NOT NULL,
        "created_by_user_id" UUID NOT NULL,
        "payer_user_id" UUID NOT NULL,
        "description" VARCHAR(200) NOT NULL,
        "amount" BIGINT NOT NULL,
        "category" VARCHAR(50) NOT NULL,
        "expense_date" DATE NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_expenses_cycle"
          FOREIGN KEY ("cycle_id") REFERENCES "cycles" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_expenses_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_expenses_payer"
          FOREIGN KEY ("payer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_expenses_amount" CHECK ("amount" > 0),
        CONSTRAINT "uq_expenses_id_cycle" UNIQUE ("id", "cycle_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "expense_participants" (
        "expense_id" UUID NOT NULL,
        "cycle_member_id" UUID NOT NULL,
        "cycle_id" UUID NOT NULL,
        CONSTRAINT "pk_expense_participants" PRIMARY KEY ("expense_id", "cycle_member_id"),
        CONSTRAINT "fk_expense_participants_expense_cycle"
          FOREIGN KEY ("expense_id", "cycle_id") REFERENCES "expenses" ("id", "cycle_id") ON DELETE RESTRICT,
        CONSTRAINT "fk_expense_participants_cycle_member_cycle"
          FOREIGN KEY ("cycle_member_id", "cycle_id") REFERENCES "cycle_members" ("id", "cycle_id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "settlements" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "cycle_id" UUID NOT NULL,
        "generated_by_user_id" UUID NOT NULL,
        "generated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "total_expenses" BIGINT NOT NULL,
        CONSTRAINT "fk_settlements_cycle"
          FOREIGN KEY ("cycle_id") REFERENCES "cycles" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_settlements_generated_by"
          FOREIGN KEY ("generated_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "uq_settlements_cycle" UNIQUE ("cycle_id"),
        CONSTRAINT "ck_settlements_total" CHECK ("total_expenses" >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "settlement_transfers" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "settlement_id" UUID NOT NULL,
        "from_user_id" UUID NOT NULL,
        "to_user_id" UUID NOT NULL,
        "amount" BIGINT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "fk_settlement_transfers_settlement"
          FOREIGN KEY ("settlement_id") REFERENCES "settlements" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_settlement_transfers_from"
          FOREIGN KEY ("from_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_settlement_transfers_to"
          FOREIGN KEY ("to_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT,
        CONSTRAINT "ck_settlement_transfers_amount" CHECK ("amount" > 0),
        CONSTRAINT "ck_settlement_transfers_users" CHECK ("from_user_id" <> "to_user_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_group_members_user_id" ON "group_members" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_cycles_group_id" ON "cycles" ("group_id")`);
    await queryRunner.query(`CREATE INDEX "idx_cycle_members_user_id" ON "cycle_members" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_incomes_cycle_member_id" ON "incomes" ("cycle_member_id")`);
    await queryRunner.query(`CREATE INDEX "idx_expenses_cycle_id" ON "expenses" ("cycle_id")`);
    await queryRunner.query(`CREATE INDEX "idx_expenses_payer_user_id" ON "expenses" ("payer_user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_expense_participants_cycle_member" ON "expense_participants" ("cycle_member_id")`);
    await queryRunner.query(`CREATE INDEX "idx_settlement_transfers_settlement" ON "settlement_transfers" ("settlement_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse dependency order to respect foreign keys.
    await queryRunner.query(`DROP TABLE "settlement_transfers"`);
    await queryRunner.query(`DROP TABLE "settlements"`);
    await queryRunner.query(`DROP TABLE "expense_participants"`);
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(`DROP TABLE "incomes"`);
    await queryRunner.query(`DROP TABLE "cycle_members"`);
    await queryRunner.query(`DROP TABLE "cycles"`);
    await queryRunner.query(`DROP TABLE "group_members"`);
    await queryRunner.query(`DROP TABLE "groups"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
