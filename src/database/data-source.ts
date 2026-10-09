import 'dotenv/config';

import { DataSource } from 'typeorm';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFile);

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,

  entities: [],

  migrations: [
    join(currentDirectory, 'migrations', '*{.ts,.js}'),
  ],

  migrationsTableName: 'migrations',
  synchronize: false,
  migrationsRun: false,
});