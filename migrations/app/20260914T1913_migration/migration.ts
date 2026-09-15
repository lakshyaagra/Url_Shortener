#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/df90e6bb0e70e9ba81f3561b01084648d9b66ab843c0ae9673edd356c0a6b03a/contract';
import endContract from '../../snapshots/df90e6bb0e70e9ba81f3561b01084648d9b66ab843c0ae9673edd356c0a6b03a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'clicks',
        columns: [
          col('clicked_at', 'timestamp', {
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('ip_address', 'character varying(45)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 45 } },
          }),
          col('referrer', 'character varying(2048)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 2048 } },
          }),
          col('url_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('user_agent', 'character varying(500)', {
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 500 } },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'clicks_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'urls',
        columns: [
          col('created_at', 'timestamp', {
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1' },
          }),
          col('expires_at', 'timestamp', { codecRef: { codecId: 'pg/timestamp-temporal@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('is_active', 'bool', { default: lit(true), codecRef: { codecId: 'pg/bool@1' } }),
          col('original_url', 'character varying(2048)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 2048 } },
          }),
          col('short_code', 'character varying(20)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 20 } },
          }),
          col('user_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'], { name: 'urls_pkey' })],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('created_at', 'timestamp', {
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamp-temporal@1' },
          }),
          col('email', 'character varying(255)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 255 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
          col('password_hash', 'character varying(100)', {
            notNull: true,
            codecRef: { codecId: 'sql/varchar@1', typeParams: { length: 100 } },
          }),
        ],
        constraints: [primaryKey(['id'], { name: 'users_pkey' })],
      }),
      this.addUnique({
        schema: 'public',
        table: 'urls',
        constraint: 'urls_short_code_key',
        columns: ['short_code'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'clicks',
        foreignKey: {
          name: 'fk_clicks_url',
          columns: ['url_id'],
          references: { schema: 'public', table: 'urls', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'urls',
        foreignKey: {
          name: 'fk_urls_user',
          columns: ['user_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
