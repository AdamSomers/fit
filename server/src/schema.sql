CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  position INT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  category_id INT NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL UNIQUE,
  is_weighted BOOLEAN NOT NULL DEFAULT false,
  is_run BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Idempotent upgrades for databases created before these columns existed.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS is_run BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  exercise_id INT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  performed_on DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  weight NUMERIC(6,1),
  note TEXT,
  distance NUMERIC(6,2),
  time_seconds INT,
  elevation_ft INT,
  UNIQUE (exercise_id, performed_on)
);

ALTER TABLE logs ADD COLUMN IF NOT EXISTS distance NUMERIC(6,2);
ALTER TABLE logs ADD COLUMN IF NOT EXISTS time_seconds INT;
ALTER TABLE logs ADD COLUMN IF NOT EXISTS elevation_ft INT;

CREATE INDEX IF NOT EXISTS idx_logs_date ON logs (performed_on);
