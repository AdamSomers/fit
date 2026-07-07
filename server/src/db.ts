import pg from 'pg';

// Return DATE columns as plain 'YYYY-MM-DD' strings, never JS Dates.
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://adam@localhost/fit',
});
