import { useEffect, useRef, useState, type ReactNode } from 'react';

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
