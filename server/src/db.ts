import pg from 'pg';

// Return DATE columns as plain 'YYYY-MM-DD' strings, never JS Dates.
pg.types.setTypeParser(1082, (v) => v);
// Return NUMERIC as a JS number (weights are small; precision is fine).
pg.types.setTypeParser(1700, (v) => parseFloat(v));

export const pool = new pg.Pool({
  // No username in the default: pg falls back to the OS user, so a fresh
  // clone works on any machine whose Postgres trusts local connections.
  connectionString: process.env.DATABASE_URL ?? 'postgres://localhost/fit',
  // Survive laptop sleep/wake: probe sockets so dead connections are culled,
  // and fail a checkout fast instead of hanging a request on a stale socket.
  keepAlive: true,
  // Generous: during a memory-pressure page-in storm, 3s produced spurious
  // "Connection terminated due to connection timeout" 500s (2026-07-28).
  connectionTimeoutMillis: 15000,
});
