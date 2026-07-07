import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { pool } from '../src/db.js';
import { app } from '../src/app.js';

// Fixture: two categories, three exercises.
let squatId: number;
let plankId: number;
let deadliftId: number;

beforeEach(async () => {
  await pool.query('TRUNCATE logs, exercises, categories RESTART IDENTITY CASCADE');
  await pool.query(
    `INSERT INTO categories (name, position) VALUES ('Main Lifts', 1), ('Core', 2)`
  );
  const res = await pool.query(
    `INSERT INTO exercises (category_id, name, is_weighted, position) VALUES
       (1, 'Barbell Squat', true, 1),
       (1, 'Barbell Deadlift', true, 2),
       (2, 'Plank', false, 1)
     RETURNING id, name`
  );
  squatId = res.rows.find((r) => r.name === 'Barbell Squat').id;
  deadliftId = res.rows.find((r) => r.name === 'Barbell Deadlift').id;
  plankId = res.rows.find((r) => r.name === 'Plank').id;
});

afterAll(async () => {
  await pool.end();
});

async function insertLog(
  exerciseId: number,
  date: string,
  fields: { completed?: boolean; weight?: number; note?: string } = {}
) {
  await pool.query(
    `INSERT INTO logs (exercise_id, performed_on, completed, weight, note)
     VALUES ($1, $2, $3, $4, $5)`,
    [exerciseId, date, fields.completed ?? false, fields.weight ?? null, fields.note ?? null]
  );
}

describe('GET /api/day/:date', () => {
  it('returns sections in category-position order with exercise shape', async () => {
    const res = await request(app).get('/api/day/2026-07-06');
    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2026-07-06');
    expect(res.body.sections.map((s: any) => s.name)).toEqual(['Main Lifts', 'Core']);
    const squat = res.body.sections[0].exercises.find((e: any) => e.name === 'Barbell Squat');
    expect(squat).toMatchObject({
      id: squatId,
      name: 'Barbell Squat',
      isWeighted: true,
      lastPerformed: null,
      lastWeight: null,
      log: null,
    });
  });

  it('lastPerformed is the latest completed log strictly before the date', async () => {
    await insertLog(squatId, '2026-07-01', { completed: true });
    await insertLog(squatId, '2026-07-04', { completed: true });
    await insertLog(squatId, '2026-07-05', { completed: false }); // not completed: ignored
    await insertLog(squatId, '2026-07-06', { completed: true }); // same day: excluded

    const res = await request(app).get('/api/day/2026-07-06');
    const squat = res.body.sections[0].exercises.find((e: any) => e.name === 'Barbell Squat');
    expect(squat.lastPerformed).toBe('2026-07-04');
  });

  it('orders exercises LRU: never-performed first, then oldest lastPerformed', async () => {
    await insertLog(squatId, '2026-07-01', { completed: true });
    await insertLog(deadliftId, '2026-07-03', { completed: true });

    const res = await request(app).get('/api/day/2026-07-06');
    // Main Lifts: neither done? squat done 7/1, deadlift 7/3 → squat before deadlift
    expect(res.body.sections[0].exercises.map((e: any) => e.name)).toEqual([
      'Barbell Squat',
      'Barbell Deadlift',
    ]);

    // Now deadlift older → deadlift first
    await pool.query('TRUNCATE logs RESTART IDENTITY');
    await insertLog(deadliftId, '2026-07-01', { completed: true });
    await insertLog(squatId, '2026-07-03', { completed: true });
    const res2 = await request(app).get('/api/day/2026-07-06');
    expect(res2.body.sections[0].exercises.map((e: any) => e.name)).toEqual([
      'Barbell Deadlift',
      'Barbell Squat',
    ]);
  });

  it('never-performed sorts before performed', async () => {
    await insertLog(squatId, '2026-07-01', { completed: true });
    const res = await request(app).get('/api/day/2026-07-06');
    expect(res.body.sections[0].exercises.map((e: any) => e.name)).toEqual([
      'Barbell Deadlift', // never performed
      'Barbell Squat',
    ]);
  });

  it('lastWeight is the latest non-null weight on or before the date', async () => {
    await insertLog(squatId, '2026-07-01', { completed: true, weight: 175 });
    await insertLog(squatId, '2026-07-06', { weight: 185 }); // same day counts
    await insertLog(squatId, '2026-07-08', { weight: 200 }); // future: excluded

    const res = await request(app).get('/api/day/2026-07-06');
    const squat = res.body.sections[0].exercises.find((e: any) => e.name === 'Barbell Squat');
    expect(squat.lastWeight).toBe(185);
  });

  it('includes the day log when present', async () => {
    await insertLog(squatId, '2026-07-06', { completed: true, weight: 185, note: 'felt strong' });
    const res = await request(app).get('/api/day/2026-07-06');
    const squat = res.body.sections[0].exercises.find((e: any) => e.name === 'Barbell Squat');
    expect(squat.log).toEqual({ completed: true, weight: 185, note: 'felt strong' });
  });

  it('rejects a malformed date', async () => {
    const res = await request(app).get('/api/day/july-6');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/logs', () => {
  it('creates a log with completed=false by default', async () => {
    const res = await request(app)
      .put('/api/logs')
      .send({ exerciseId: squatId, date: '2026-07-06' });
    expect(res.status).toBe(200);
    expect(res.body.log).toEqual({ completed: false, weight: null, note: null });
  });

  it('partial updates touch only provided fields', async () => {
    await request(app).put('/api/logs').send({ exerciseId: squatId, date: '2026-07-06' });
    await request(app)
      .put('/api/logs')
      .send({ exerciseId: squatId, date: '2026-07-06', weight: 185 });
    const res = await request(app)
      .put('/api/logs')
      .send({ exerciseId: squatId, date: '2026-07-06', completed: true });
    expect(res.body.log).toEqual({ completed: true, weight: 185, note: null });
  });

  it('can clear weight and note with explicit nulls', async () => {
    await request(app)
      .put('/api/logs')
      .send({ exerciseId: squatId, date: '2026-07-06', weight: 185, note: 'x' });
    const res = await request(app)
      .put('/api/logs')
      .send({ exerciseId: squatId, date: '2026-07-06', weight: null, note: null });
    expect(res.body.log).toEqual({ completed: false, weight: null, note: null });
  });

  it('404s on unknown exercise', async () => {
    const res = await request(app).put('/api/logs').send({ exerciseId: 9999, date: '2026-07-06' });
    expect(res.status).toBe(404);
  });

  it('400s on bad date', async () => {
    const res = await request(app).put('/api/logs').send({ exerciseId: squatId, date: 'nope' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/logs/:exerciseId/:date', () => {
  it('removes the log', async () => {
    await request(app).put('/api/logs').send({ exerciseId: squatId, date: '2026-07-06' });
    const res = await request(app).delete(`/api/logs/${squatId}/2026-07-06`);
    expect(res.status).toBe(204);
    const day = await request(app).get('/api/day/2026-07-06');
    const squat = day.body.sections[0].exercises.find((e: any) => e.name === 'Barbell Squat');
    expect(squat.log).toBeNull();
  });

  it('is a no-op 204 when nothing exists', async () => {
    const res = await request(app).delete(`/api/logs/${plankId}/2026-07-06`);
    expect(res.status).toBe(204);
  });
});

describe('GET /api/exercises', () => {
  it('lists all exercises with category and active flag, in section order', async () => {
    await pool.query('UPDATE exercises SET active = false WHERE id = $1', [plankId]);
    const res = await request(app).get('/api/exercises');
    expect(res.status).toBe(200);
    expect(res.body.exercises.map((e: any) => e.name)).toEqual([
      'Barbell Squat',
      'Barbell Deadlift',
      'Plank',
    ]);
    const plank = res.body.exercises.find((e: any) => e.name === 'Plank');
    expect(plank).toMatchObject({ category: 'Core', active: false, isWeighted: false });
  });
});

describe('PATCH /api/exercises/:id', () => {
  it('deactivates and reactivates an exercise', async () => {
    let res = await request(app).patch(`/api/exercises/${plankId}`).send({ active: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: plankId, active: false });
    res = await request(app).patch(`/api/exercises/${plankId}`).send({ active: true });
    expect(res.body.active).toBe(true);
  });

  it('404s on unknown exercise', async () => {
    const res = await request(app).patch('/api/exercises/9999').send({ active: false });
    expect(res.status).toBe(404);
  });

  it('400s on missing active field', async () => {
    const res = await request(app).patch(`/api/exercises/${plankId}`).send({});
    expect(res.status).toBe(400);
  });
});

describe('day page visibility of inactive exercises', () => {
  it('hides inactive exercises with no log that day', async () => {
    await pool.query('UPDATE exercises SET active = false WHERE id = $1', [plankId]);
    const res = await request(app).get('/api/day/2026-07-06');
    const core = res.body.sections.find((s: any) => s.name === 'Core');
    expect(core).toBeUndefined(); // Plank was Core's only exercise
  });

  it('still shows an inactive exercise on a day where it has a log', async () => {
    await insertLog(plankId, '2026-07-05', { completed: true });
    await pool.query('UPDATE exercises SET active = false WHERE id = $1', [plankId]);
    const day5 = await request(app).get('/api/day/2026-07-05');
    const core5 = day5.body.sections.find((s: any) => s.name === 'Core');
    expect(core5.exercises.map((e: any) => e.name)).toEqual(['Plank']);
    const day6 = await request(app).get('/api/day/2026-07-06');
    expect(day6.body.sections.find((s: any) => s.name === 'Core')).toBeUndefined();
  });
});

describe('POST /api/exercises', () => {
  it('adds to an existing category', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .send({ name: 'Barbell Row', category: 'Main Lifts', isWeighted: true });
    expect(res.status).toBe(201);
    const day = await request(app).get('/api/day/2026-07-06');
    const names = day.body.sections[0].exercises.map((e: any) => e.name);
    expect(names).toContain('Barbell Row');
  });

  it('creates a new category at the end', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .send({ name: 'Sprints', category: 'Conditioning', isWeighted: false });
    expect(res.status).toBe(201);
    const day = await request(app).get('/api/day/2026-07-06');
    expect(day.body.sections.map((s: any) => s.name)).toEqual([
      'Main Lifts',
      'Core',
      'Conditioning',
    ]);
  });

  it('409s on duplicate name', async () => {
    const res = await request(app)
      .post('/api/exercises')
      .send({ name: 'Plank', category: 'Core', isWeighted: false });
    expect(res.status).toBe(409);
  });
});
