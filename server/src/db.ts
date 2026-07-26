import pg from 'pg';

// Return DATE columns as plain 'YYYY-MM-DD' strings, never JS Dates.
pg.types.setTypeParser(1082, (v) => v);
// Return NUMERIC as a JS number (weights are small; precision is fine).
pg.types.setTypeParser(1700, (v) => parseFloat(v));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgres://adam@localhost/fit',
  // Survive laptop sleep/wake: probe sockets so dead connections are culled,
  // and fail a checkout fast instead of hanging a request on a stale socket.
  keepAlive: true,
  connectionTimeoutMillis: 3000,
});
