import { pool } from './db.js';

export interface DayLog {
  completed: boolean;
  weight: number | null;
  note: string | null;
}

export interface DayExercise {
  id: number;
  name: string;
  isWeighted: boolean;
  lastPerformed: string | null;
  lastWeight: number | null;
  log: DayLog | null;
}

export interface DaySection {
  id: number;
  name: string;
  exercises: DayExercise[];
}

export interface DayPayload {
  date: string;
  sections: DaySection[];
}

export async function getDay(date: string): Promise<DayPayload> {
  const { rows } = await pool.query(
    `SELECT c.id AS cat_id, c.name AS cat_name,
            e.id, e.name, e.is_weighted,
            lp.last_performed,
            lw.last_weight,
            l.completed, l.weight, l.note, (l.id IS NOT NULL) AS has_log
     FROM exercises e
     JOIN categories c ON c.id = e.category_id
     LEFT JOIN logs l ON l.exercise_id = e.id AND l.performed_on = $1
     LEFT JOIN LATERAL (
       SELECT max(performed_on) AS last_performed FROM logs
       WHERE exercise_id = e.id AND completed AND performed_on < $1
     ) lp ON true
     LEFT JOIN LATERAL (
       SELECT weight AS last_weight FROM logs
       WHERE exercise_id = e.id AND weight IS NOT NULL AND performed_on <= $1
       ORDER BY performed_on DESC LIMIT 1
     ) lw ON true
     WHERE e.active OR l.id IS NOT NULL
     ORDER BY c.position, lp.last_performed ASC NULLS FIRST, e.position, e.name`,
    [date]
  );

  const sections: DaySection[] = [];
  for (const row of rows) {
    let section = sections.find((s) => s.id === row.cat_id);
    if (!section) {
      section = { id: row.cat_id, name: row.cat_name, exercises: [] };
      sections.push(section);
    }
    section.exercises.push({
      id: row.id,
      name: row.name,
      isWeighted: row.is_weighted,
      lastPerformed: row.last_performed,
      lastWeight: row.last_weight,
      log: row.has_log
        ? { completed: row.completed, weight: row.weight, note: row.note }
        : null,
    });
  }
  return { date, sections };
}

export interface LogFields {
  completed?: boolean;
  weight?: number | null;
  note?: string | null;
}

export async function upsertLog(
  exerciseId: number,
  date: string,
  fields: LogFields
): Promise<DayLog> {
  // Only fields present in the request overwrite existing values.
  const sets: string[] = [];
  if ('completed' in fields) sets.push('completed = EXCLUDED.completed');
  if ('weight' in fields) sets.push('weight = EXCLUDED.weight');
  if ('note' in fields) sets.push('note = EXCLUDED.note');
  const conflictAction = sets.length
    ? `DO UPDATE SET ${sets.join(', ')}`
    : 'DO UPDATE SET completed = logs.completed'; // no-op so RETURNING still fires

  const { rows } = await pool.query(
    `INSERT INTO logs (exercise_id, performed_on, completed, weight, note)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (exercise_id, performed_on) ${conflictAction}
     RETURNING completed, weight, note`,
    [exerciseId, date, fields.completed ?? false, fields.weight ?? null, fields.note ?? null]
  );
  return rows[0];
}

export interface LibraryExercise {
  id: number;
  name: string;
  category: string;
  isWeighted: boolean;
  active: boolean;
}

export async function listExercises(): Promise<LibraryExercise[]> {
  const { rows } = await pool.query(
    `SELECT e.id, e.name, c.name AS category, e.is_weighted, e.active
     FROM exercises e
     JOIN categories c ON c.id = e.category_id
     ORDER BY c.position, e.position, e.name`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    isWeighted: r.is_weighted,
    active: r.active,
  }));
}

export async function setExerciseActive(id: number, active: boolean): Promise<boolean> {
  const { rowCount } = await pool.query('UPDATE exercises SET active = $2 WHERE id = $1', [
    id,
    active,
  ]);
  return (rowCount ?? 0) > 0;
}

export async function deleteLog(exerciseId: number, date: string): Promise<void> {
  await pool.query('DELETE FROM logs WHERE exercise_id = $1 AND performed_on = $2', [
    exerciseId,
    date,
  ]);
}

export async function createExercise(
  name: string,
  category: string,
  isWeighted: boolean
): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cat = await client.query(
      `INSERT INTO categories (name, position)
       VALUES ($1, (SELECT COALESCE(max(position), 0) + 1 FROM categories))
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [category]
    );
    const ex = await client.query(
      `INSERT INTO exercises (category_id, name, is_weighted, position)
       VALUES ($1, $2, $3,
               (SELECT COALESCE(max(position), 0) + 1 FROM exercises WHERE category_id = $1))
       RETURNING id`,
      [cat.rows[0].id, name, isWeighted]
    );
    await client.query('COMMIT');
    return ex.rows[0].id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
