const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const args = process.argv.slice(2);
const dirFlagIndex = args.indexOf('--dir');
if (dirFlagIndex === -1 || !args[dirFlagIndex + 1]) {
  console.error('Usage: node run-migrations.js --dir <migrations-folder>');
  process.exit(1);
}

const migrationsDir = path.resolve(process.cwd(), args[dirFlagIndex + 1]);
const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? 'pillar_core',
  user: process.env.POSTGRES_USER ?? 'pillar',
  password: process.env.POSTGRES_PASSWORD ?? 'pillar'
});

async function run() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running ${file}`);
    await pool.query(sql);
  }

  await pool.end();
  console.log('Migrations complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
