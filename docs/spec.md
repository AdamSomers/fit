# Fit — Spec

A local web app for tracking a personal exercise library, organized by day. Not a workout planner. Adam decides in the moment what to do; the app surfaces what hasn't been done recently and records what happened.

## Core Concepts

**Exercise library.** A fixed (but editable over time) set of exercises, each belonging to a category. Categories are data, not code: adding an exercise with a new category creates a new section in the UI. Initial categories: Main Lifts, Accessory Lifts, Core.

**Day page.** The UI shows one day at a time, defaulting to today. The full library is visible on every day page. Navigate to previous days (and forward, up to today). Past days are fully editable — that's how forgotten workouts get logged.

**Log entry.** Tapping a card selects the exercise for that day (creates a log row). A selected card shows an outline and a checkbox in the upper-right; checking it marks the exercise completed. Un-tapping deselects (deletes the row). A log entry can carry a weight and a note. No save button; every action persists immediately.

**Weight.** Weighted exercises display the last entered weight on their card, with a button to update it. Updating the weight writes it to that day's log entry (creating one if needed). "Last weight" = most recent non-null weight on any log dated on or before the viewed day.

**Runs.** Run-type exercises (Running category: Trail Run, Road Run, Workout Run) take optional per-day details: distance (mi), time (h:mm:ss), elevation gain (ft). All optional, stored on the log entry. The card shows a one-line summary of whatever was entered (e.g. "5.2 mi · 44:30 · 820 ft") with an edit button.

**Last performed.** Each card shows "Last performed on MM/DD/YYYY" — the most recent day *before* the viewed day with a completed log. Never performed shows "Never".

## Ordering

Within each section, cards are ordered LRU: least-recently-performed first (never-performed sorts first), left to right. The order is computed when the page loads for a given day and **never re-orders afterward** — checking off an exercise does not move its card.

## Layout

- Sections stacked vertically in category order: Main Lifts, Accessory Lifts, Core, then any new categories.
- Cards in a grid: 2 columns on small screens, more on larger, with a reasonable max page width.
- Mobile-first; primary use is a phone during a 15–45 minute workout window.

## Data Model (PostgreSQL, database `fit`)

```
categories: id, name (unique), position
exercises:  id, category_id → categories, name (unique), is_weighted, is_run,
            position, active
logs:       id, exercise_id → exercises, performed_on (date),
            completed (bool, default false), weight numeric nullable,
            note text nullable, distance numeric nullable,
            time_seconds int nullable, elevation_ft int nullable,
            UNIQUE(exercise_id, performed_on)
```

Dates are plain calendar dates (no timezones). The client sends its local date; the server never converts.

## Seed Exercises

Main Lifts (weighted): Barbell Deadlift, Barbell Squat, Barbell Shoulder Press, Dynamic Landmine Lunge Press.
Accessory Lifts (weighted): Bulgarian Split Squat, Rotational Step Up, Jefferson Curl.
Core (bodyweight): Clamshell with Hip Internal Rotation, Plank, Little Bear Shoulder Taps, Upper Trunk Rotation, Side Plank Thread the Needle, Superman, Fire Hydrants, Banded Row w/ Thoracic Rotation, Rotator Cuff Isometric Walkout.
Running (run): Trail Run, Road Run, Workout Run.

**Adding exercises.** A form at the bottom of the day page adds an exercise with a name, category (existing or new; a new category becomes a new section), and a weighted flag.

**History.** A history page (day-page footer) shows the whole library as a side-scrolling table: exercise rows grouped by category, one column per day from today back to the earliest log, newest first. Cells show the day's weight, run distance, or a check; hover/long-press reveals full details. The exercise-name column and date header are sticky; the full library fits on one vertical page on a phone. Hidden exercises appear (dimmed) if they have history.

**Hiding exercises.** A settings page (linked from the day page footer) lists the whole library with show/hide toggles. Hidden exercises (`exercises.active = false`) disappear from day pages going forward, but still appear on any day where they have a log entry, so history is preserved.

## API

- `GET /api/day/:date` — the whole page payload: sections → exercises with `lastPerformed`, `lastWeight`, and that day's `log` (or null). Exercises pre-sorted LRU by the server.
- `PUT /api/logs` — upsert `{exerciseId, date, completed?, weight?, note?}`; only provided fields change. Creates the row if missing.
- `DELETE /api/logs/:exerciseId/:date` — deselect.
- `POST /api/exercises` — add `{name, category, isWeighted}`; creates the category if new.
- `GET /api/exercises` — full library with `active` flags (settings page).
- `GET /api/history?today=YYYY-MM-DD` — day columns + per-exercise log maps (history page).
- `PATCH /api/exercises/:id` — `{active}` to show/hide.

## Stack & Environment

- **Backend:** Node 22, Express 5, TypeScript, `pg` with plain SQL. Port **8003**, binds 0.0.0.0.
- **Frontend:** Vite + React + TypeScript. Port **5177**, host 0.0.0.0, `allowedHosts: true`, dev proxy `/api` → 8003.
- **Database:** PostgreSQL 16 (Homebrew), database `fit`.
- **Tests:** Vitest + Supertest against a `fit_test` database.

## Non-Goals

Sessions, timers, sets/reps counting, auth, multi-user, deployment. It runs on botbox.local for LAN access.
