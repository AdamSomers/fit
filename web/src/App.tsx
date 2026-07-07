import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteLog, fetchDay, putLog, type LogPatch } from './api';
import { AddExercise } from './components/AddExercise';
import { DayNav } from './components/DayNav';
import { Section } from './components/Section';
import { SettingsPage } from './components/SettingsPage';
import { todayStr } from './dates';
import type { DayExercise, DayPayload } from './types';

export default function App() {
  const [today, setToday] = useState(todayStr);
  const [date, setDate] = useState(today);
  const [payload, setPayload] = useState<DayPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'day' | 'settings'>('day');

  // If the app sits open past midnight, pick up the new day when it regains
  // focus or becomes visible again (phone browsers resurrect old tabs).
  useEffect(() => {
    const refresh = () => setToday(todayStr());
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // When the day rolls over and we were viewing the old "today", follow it —
  // otherwise yesterday's page (and its selections) lingers as if current.
  const prevTodayRef = useRef(today);
  useEffect(() => {
    const prev = prevTodayRef.current;
    if (prev !== today) {
      prevTodayRef.current = today;
      setDate((d) => (d === prev ? today : d));
    }
  }, [today]);

  // Guards against out-of-order responses when flipping days quickly.
  const dateRef = useRef(date);
  dateRef.current = date;

  const load = useCallback(() => {
    setError(null);
    fetchDay(date)
      .then((p) => {
        if (p.date === dateRef.current) setPayload(p);
      })
      .catch((e) => setError(String(e)));
  }, [date]);

  useEffect(load, [load]);

  // Only render a payload that belongs to the viewed date — never bleed the
  // previous day's cards (and their selected state) onto a new date.
  const current = payload && payload.date === date ? payload : null;

  // Patch one exercise in place. Section/exercise order is frozen from the
  // initial fetch — mutations never re-sort (LRU order freeze).
  const patchExercise = (exerciseId: number, patch: Partial<DayExercise>) => {
    setPayload((p) =>
      p
        ? {
            ...p,
            sections: p.sections.map((s) => ({
              ...s,
              exercises: s.exercises.map((e) =>
                e.id === exerciseId ? { ...e, ...patch } : e
              ),
            })),
          }
        : p
    );
  };

  const findExercise = (exerciseId: number): DayExercise | undefined =>
    payload?.sections.flatMap((s) => s.exercises).find((e) => e.id === exerciseId);

  /** Tap: select (create log) or un-tap (delete log). Optimistic; refetch on failure. */
  const toggleSelect = (exerciseId: number) => {
    const ex = findExercise(exerciseId);
    if (!ex) return;
    if (ex.log) {
      patchExercise(exerciseId, { log: null });
      deleteLog(exerciseId, date).catch(load);
    } else {
      patchExercise(exerciseId, { log: { completed: false, weight: null, note: null } });
      putLog(exerciseId, date).catch(load);
    }
  };

  /** Update log fields (completed / weight / note). Creates the log if needed. */
  const updateLog = (exerciseId: number, fields: LogPatch) => {
    const ex = findExercise(exerciseId);
    if (!ex) return;
    const optimistic = {
      completed: fields.completed ?? ex.log?.completed ?? false,
      weight: 'weight' in fields ? (fields.weight ?? null) : (ex.log?.weight ?? null),
      note: 'note' in fields ? (fields.note ?? null) : (ex.log?.note ?? null),
    };
    const patch: Partial<DayExercise> = { log: optimistic };
    if (optimistic.weight != null) patch.lastWeight = optimistic.weight;
    patchExercise(exerciseId, patch);
    putLog(exerciseId, date, fields).catch(load);
  };

  if (view === 'settings') {
    return (
      <SettingsPage
        onBack={() => {
          setView('day');
          load(); // hidden/shown exercises change the day page
        }}
      />
    );
  }

  return (
    <div className="app">
      <DayNav date={date} today={today} onNavigate={setDate} />
      {error && (
        <div className="error">
          Couldn’t reach the server. <button onClick={load}>Retry</button>
        </div>
      )}
      {current?.sections.map((section) => (
        <Section
          key={section.id}
          section={section}
          onToggleSelect={toggleSelect}
          onUpdateLog={updateLog}
        />
      ))}
      {current && (
        <>
          <AddExercise
            categories={current.sections.map((s) => s.name)}
            onAdded={load}
          />
          <footer className="page-footer">
            <button className="footer-link" onClick={() => setView('settings')}>
              ⚙ settings
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
