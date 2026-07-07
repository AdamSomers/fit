import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const here = dirname(fileURLToPath(import.meta.url));
const noSeed = process.argv.includes('--no-seed');

const schema = readFileSync(join(here, 'schema.sql'), 'utf8');
await pool.query(schema);
console.log('schema applied');

if (!noSeed) {
  const seed = readFileSync(join(here, 'seed.sql'), 'utf8');
  await pool.query(seed);
  console.log('seed applied');
}

await pool.end();
