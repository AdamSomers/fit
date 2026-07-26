import type { DayLog, DayPayload, HistoryPayload, LibraryExercise } from './types';

async function check<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function fetchDay(date: string): Promise<DayPayload> {
  return fetch(`/api/day/${date}`).then((r) => check<DayPayload>(r));
}

export interface LogPatch {
  completed?: boolean;
  weight?: number | null;
  note?: string | null;
  distance?: number | null;
  timeSeconds?: number | null;
  elevationFt?: number | null;
}

export function putLog(
  exerciseId: number,
  date: string,
  patch: LogPatch = {}
): Promise<{ log: DayLog }> {
  return fetch('/api/logs', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exerciseId, date, ...patch }),
  }).then((r) => check<{ log: DayLog }>(r));
}

export async function deleteLog(exerciseId: number, date: string): Promise<void> {
  const res = await fetch(`/api/logs/${exerciseId}/${date}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`${res.status}`);
}

export function fetchHistory(today: string): Promise<HistoryPayload> {
  return fetch(`/api/history?today=${today}`).then((r) => check<HistoryPayload>(r));
}

export function fetchExercises(): Promise<{ exercises: LibraryExercise[] }> {
  return fetch('/api/exercises').then((r) => check<{ exercises: LibraryExercise[] }>(r));
}

export function setExerciseActive(id: number, active: boolean): Promise<unknown> {
  return fetch(`/api/exercises/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  }).then((r) => check(r));
}

export function createExercise(
  name: string,
  category: string,
  isWeighted: boolean,
  isRun: boolean
): Promise<{ id: number }> {
  return fetch('/api/exercises', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category, isWeighted, isRun }),
  }).then((r) => check<{ id: number }>(r));
}
