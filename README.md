# Fit

A local web app for tracking my exercise library, organized by day. The library surfaces what hasn't been done recently (LRU order), I tap what I'm doing today, check it off when done, and record weights for lifts. No sessions, no sets/reps, no save button.

Spec: `docs/spec.md`. Build plan: `docs/superpowers/plans/2026-07-06-fit-app.md`.

## Running it locally

Requirements: Node 22+ and PostgreSQL 16 (any install works; on macOS, `brew install postgresql@16`). Postgres must accept local connections from your OS user, which is the Homebrew default.

```bash
git clone https://github.com/AdamSomers/fit.git
cd fit
createdb fit
npm install
npm run migrate     # applies the schema and seeds the exercise library
npm run dev         # web on http://localhost:5177, api on 8003
```

Open http://localhost:5177. That's it.

Notes:

- The database connection defaults to `postgres://localhost/fit` (your OS user). Point `DATABASE_URL` somewhere else if your setup differs.
- The seed is my exercise library. Add your own exercises from the form at the bottom of the day page, and hide any of mine you don't want from the settings page. Or edit `server/src/seed.sql` before migrating.
- The dev servers bind `0.0.0.0`, so you can open the app from a phone on the same network at `http://<your-hostname>.local:5177`. Phone-first is the intended use.

## How I run it day to day (macOS)

A launchd service (`com.adam.fit`, plist in `~/Library/LaunchAgents/`) runs
`server/src/index.ts` at login and restarts it on crash. That one process
serves the API on 8003 and the built web app on 5177. Logs go to
`~/Library/Logs/fit.log`. After changing web code, rebuild and restart:

```bash
npm run build -w web
launchctl kickstart -k gui/501/com.adam.fit
```

Don't run the daily-use app from a watch-mode dev server left in a terminal or
Claude session: that setup degraded over two weeks of laptop sleep cycles and
died when the owning session closed (July 2026). The launchd service exists
because of that. Requests slower than 500ms are logged to fit.log with timings,
and the server pings itself every 5 minutes so memory pressure can't swap it
out cold.

## Stack

- **Web:** Vite + React + TypeScript (`web/`), port 5177
- **API:** Express 5 + TypeScript + pg, plain SQL (`server/`), port 8003
- **DB:** PostgreSQL 16, database `fit` (tests use `fit_test`)

## Tests

```bash
createdb fit_test
DATABASE_URL=postgres://localhost/fit_test npm run migrate -w server -- --no-seed
npm test            # server API tests (vitest + supertest against fit_test)
```

The first two lines are one-time setup.

## Notes for future maintenance

- All dates are plain `YYYY-MM-DD` strings end to end. The client sends its local date; the server never touches timezones (`db.ts` parses Postgres DATE as string).
- Card order is computed by the server per requested date and frozen client-side until the next fetch. Completing an exercise must not re-sort the grid.
- Creating a log for a weighted exercise without an explicit weight stores the carried-forward last weight, so history records the working weight even when it didn't change.
- Adding an exercise with a new category automatically creates a new UI section (form at the bottom of the day page).
- Hiding an exercise (settings page, day-page footer) sets `exercises.active = false`. Day queries include inactive exercises only on dates where a log row exists, so history survives.
