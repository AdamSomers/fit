# Fit

A local web app for tracking my exercise library, organized by day. The library surfaces what hasn't been done recently (LRU order), I tap what I'm doing today, check it off when done, and record weights for lifts. No sessions, no sets/reps, no save button.

Spec: `docs/spec.md`. Build plan: `docs/superpowers/plans/2026-07-06-fit-app.md`.

## Running

**Production (how it normally runs):** a launchd service (`com.adam.fit`, plist in
`~/Library/LaunchAgents/`) runs `server/src/index.ts` at login and restarts it on
crash. That one process serves the API on 8003 and the built web app on 5177.
Logs: `~/Library/Logs/fit.log`. After changing web code, rebuild and restart:

```bash
npm run build -w web
launchctl kickstart -k gui/501/com.adam.fit
```

**Development:**

```bash
npm install
npm run migrate     # applies schema + seed to the fit database
npm run dev         # vite on 5177 (takes the port over), tsx watch api on 8003
```

Open http://localhost:5177 (or http://botbox.local:5177 from the LAN).

Do not run the daily-use app from a watch-mode dev server left in a terminal or
Claude session: that setup degraded over two weeks of laptop sleep cycles and
died when the owning session closed (July 2026). The launchd service exists
because of that. Requests slower than 500ms are logged to fit.log with timings.

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
- Adding an exercise with a new category automatically creates a new UI section (form at the bottom of the day page).
- Hiding an exercise (settings page, day-page footer) sets `exercises.active = false`. Day queries include inactive exercises only on dates where a log row exists, so history survives.
