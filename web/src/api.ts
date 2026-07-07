import type { DayLog, DayPayload } from './types';

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
