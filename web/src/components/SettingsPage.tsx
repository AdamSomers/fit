import { useEffect, useState } from 'react';
import { fetchExercises, setExerciseActive } from '../api';
import type { LibraryExercise } from '../types';

interface Props {
  onBack: () => void;
}

export function SettingsPage({ onBack }: Props) {
  const [exercises, setExercises] = useState<LibraryExercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    fetchExercises()
      .then((r) => setExercises(r.exercises))
      .catch((e) => setError(String(e)));
  };

  useEffect(load, []);

  const toggle = (id: number, active: boolean) => {
    setExercises((list) =>
      list ? list.map((e) => (e.id === id ? { ...e, active } : e)) : list
    );
    setExerciseActive(id, active).catch(load);
  };

  const categories = exercises
    ? [...new Set(exercises.map((e) => e.category))]
    : [];

  return (
    <div className="app">
      <header className="daynav">
        <button className="daynav-arrow" aria-label="Back" onClick={onBack}>
          ‹
        </button>
        <div className="daynav-label">
          <h1>Settings</h1>
          <div className="daynav-date">show / hide exercises</div>
        </div>
        <div className="daynav-spacer" />
      </header>
      {error && (
        <div className="error">
          Couldn’t reach the server. <button onClick={load}>Retry</button>
        </div>
      )}
      {categories.map((cat) => (
        <section className="section" key={cat}>
          <h2>{cat}</h2>
          <div className="settings-list">
            {exercises!
              .filter((e) => e.category === cat)
              .map((e) => (
                <label key={e.id} className={`settings-row${e.active ? '' : ' hidden-ex'}`}>
                  <input
                    type="checkbox"
                    checked={e.active}
                    onChange={(ev) => toggle(e.id, ev.target.checked)}
                  />
                  <span className="settings-check">{e.active ? '✓' : ''}</span>
                  <span className="settings-name">{e.name}</span>
                </label>
              ))}
          </div>
        </section>
      ))}
      <p className="settings-hint">
        Hidden exercises stay in history on days they were logged.
      </p>
    </div>
  );
}
