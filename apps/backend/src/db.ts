import { Pool } from 'pg';

export const db: Pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? 'pillar_core',
  user: process.env.POSTGRES_USER ?? 'pillar',
  password: process.env.POSTGRES_PASSWORD ?? 'pillar'
});
