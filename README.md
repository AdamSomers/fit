# Fit

A local web app for tracking my exercise library, organized by day. The library surfaces what hasn't been done recently (LRU order), I tap what I'm doing today, check it off when done, and record weights for lifts. No sessions, no sets/reps, no save button.

Spec: `docs/spec.md`. Build plan: `docs/superpowers/plans/2026-07-06-fit-app.md`.

## Running

```bash
npm install
npm run migrate     # applies schema + seed to the fit database
npm run dev         # api on 0.0.0.0:8003, web on 0.0.0.0:5177
```

Open http://localhost:5177 (or http://botbox.local:5177 from the LAN).

## Stack

- **Web:** Vite + React + TypeScript (`web/`), port 5177
- **API:** Express 5 + TypeScript + pg (`server/`), port 8003
- **DB:** PostgreSQL 16, database `fit` (tests use `fit_test`)

## Tests

```bash
npm test            # server API tests (vitest + supertest against fit_test)
```

First-time test setup: `createdb fit_test && DATABASE_URL=postgres://adam@localhost/fit_test npm run migrate -w server -- --no-seed`

## Notes for future maintenance

- All dates are plain `YYYY-MM-DD` strings end to end. The client sends its local date; the server never touches timezones (`db.ts` parses Postgres DATE as string).
- Card order is computed by the server per requested date and frozen client-side until the next fetch — completing an exercise must not re-sort the grid.
- Adding an exercise with a new category automatically creates a new UI section (`POST /api/exercises`). No UI for this yet; use curl or ask Claude.
