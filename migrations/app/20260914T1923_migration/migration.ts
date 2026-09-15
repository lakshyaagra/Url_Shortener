#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/d5420ef517956dcc9e0577812654b3ac6624fdfed480025194a3971a7f89bdd5/contract';
import endContract from '../../snapshots/d5420ef517956dcc9e0577812654b3ac6624fdfed480025194a3971a7f89bdd5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/df90e6bb0e70e9ba81f3561b01084648d9b66ab843c0ae9673edd356c0a6b03a/contract';
import startContract from '../../snapshots/df90e6bb0e70e9ba81f3561b01084648d9b66ab843c0ae9673edd356c0a6b03a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createIndex({
        schema: 'public',
        table: 'clicks',
        index: 'idx_clicks_url_id_clicked_at',
        columns: ['url_id', 'clicked_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'urls',
        index: 'idx_urls_user_id_created_at',
        columns: ['user_id', 'created_at'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
