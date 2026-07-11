import express from 'express';
import {
  createExercise,
  deleteLog,
  getDay,
  listExercises,
  setExerciseActive,
  upsertLog,
} from './queries.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const app = express();
app.use(express.json());

app.get('/api/day/:date', async (req, res) => {
  const { date } = req.params;
  if (!DATE_RE.test(date)) return res.status(400).json({ error: 'bad date' });
  res.json(await getDay(date));
});

app.put('/api/logs', async (req, res) => {
  const { exerciseId, date, ...fields } = req.body ?? {};
  if (!Number.isInteger(exerciseId)) return res.status(400).json({ error: 'bad exerciseId' });
  if (typeof date !== 'string' || !DATE_RE.test(date))
    return res.status(400).json({ error: 'bad date' });
  try {
    const log = await upsertLog(exerciseId, date, fields);
    res.json({ exerciseId, date, log });
  } catch (err: any) {
    if (err.code === '23503') return res.status(404).json({ error: 'unknown exercise' });
    throw err;
  }
});

app.delete('/api/logs/:exerciseId/:date', async (req, res) => {
  const exerciseId = Number(req.params.exerciseId);
  const { date } = req.params;
  if (!Number.isInteger(exerciseId) || !DATE_RE.test(date))
    return res.status(400).json({ error: 'bad params' });
  await deleteLog(exerciseId, date);
  res.status(204).end();
});

app.get('/api/exercises', async (_req, res) => {
  res.json({ exercises: await listExercises() });
});

app.patch('/api/exercises/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { active } = req.body ?? {};
  if (!Number.isInteger(id) || typeof active !== 'boolean')
    return res.status(400).json({ error: 'id and boolean active required' });
  const found = await setExerciseActive(id, active);
  if (!found) return res.status(404).json({ error: 'unknown exercise' });
  res.json({ id, active });
});

app.post('/api/exercises', async (req, res) => {
  const { name, category, isWeighted, isRun } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || typeof category !== 'string' || !category.trim())
    return res.status(400).json({ error: 'name and category required' });
  try {
    const id = await createExercise(name.trim(), category.trim(), Boolean(isWeighted), Boolean(isRun));
    res.status(201).json({ id });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'exercise already exists' });
    throw err;
  }
});
