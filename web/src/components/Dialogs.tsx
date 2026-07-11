import { useEffect, useRef, useState, type ReactNode } from 'react';
import { formatDuration, parseDuration } from '../run';
import type { DayLog } from '../types';

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onClick={(e) => {
        // click on backdrop closes
        if (e.target === ref.current) onClose();
        e.stopPropagation();
      }}
    >
      <h3>{title}</h3>
      {children}
    </dialog>
  );
}

export function WeightDialog({
  name,
  initial,
  onSave,
  onClose,
}: {
  name: string;
  initial: number | null;
  onSave: (weight: number | null) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial != null ? String(initial) : '');
  const save = () => {
    const trimmed = value.trim();
    if (trimmed === '') return onSave(null);
    const n = parseFloat(trimmed);
    if (!Number.isNaN(n)) onSave(n);
  };
  return (
    <Dialog title={name} onClose={onClose}>
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="dialog-row">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="weight"
          />
          <span className="dialog-unit">lb</span>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            cancel
          </button>
          <button type="submit" className="btn-accent">
            save
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export interface RunDetails {
  distance: number | null;
  timeSeconds: number | null;
  elevationFt: number | null;
}

export function RunDialog({
  name,
  initial,
  onSave,
  onClose,
}: {
  name: string;
  initial: DayLog | null;
  onSave: (details: RunDetails) => void;
  onClose: () => void;
}) {
  const [distance, setDistance] = useState(
    initial?.distance != null ? String(initial.distance) : ''
  );
  const [time, setTime] = useState(
    initial?.timeSeconds != null ? formatDuration(initial.timeSeconds) : ''
  );
  const [elevation, setElevation] = useState(
    initial?.elevationFt != null ? String(initial.elevationFt) : ''
  );

  const save = () => {
    const d = parseFloat(distance);
    const e = parseInt(elevation, 10);
    onSave({
      distance: Number.isNaN(d) ? null : d,
      timeSeconds: parseDuration(time),
      elevationFt: Number.isNaN(e) ? null : e,
    });
  };

  return (
    <Dialog title={name} onClose={onClose}>
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="dialog-row">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            autoFocus
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="distance"
          />
          <span className="dialog-unit">mi</span>
        </div>
        <div className="dialog-row">
          <input
            type="text"
            inputMode="numeric"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="time (44:30 or 1:02:10)"
          />
          <span className="dialog-unit">h:m:s</span>
        </div>
        <div className="dialog-row">
          <input
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            value={elevation}
            onChange={(e) => setElevation(e.target.value)}
            placeholder="elevation gain"
          />
          <span className="dialog-unit">ft</span>
        </div>
        <div className="dialog-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            cancel
          </button>
          <button type="submit" className="btn-accent">
            save
          </button>
        </div>
      </form>
    </Dialog>
  );
}

export function NoteDialog({
  name,
  initial,
  onSave,
  onClose,
}: {
  name: string;
  initial: string | null;
  onSave: (note: string | null) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initial ?? '');
  return (
    <Dialog title={name} onClose={onClose}>
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(value.trim() === '' ? null : value.trim());
        }}
      >
        <textarea
          autoFocus
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="notes for today…"
        />
        <div className="dialog-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            cancel
          </button>
          <button type="submit" className="btn-accent">
            save
          </button>
        </div>
      </form>
    </Dialog>
  );
}
