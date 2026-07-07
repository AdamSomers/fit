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
  position INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Idempotent upgrade for databases created before the column existed.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  exercise_id INT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  performed_on DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  weight NUMERIC(6,1),
  note TEXT,
  UNIQUE (exercise_id, performed_on)
);

CREATE INDEX IF NOT EXISTS idx_logs_date ON logs (performed_on);
