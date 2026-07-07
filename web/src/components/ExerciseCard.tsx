import { useState } from 'react';
import type { LogPatch } from '../api';
import { formatMDY } from '../dates';
import type { DayExercise } from '../types';
import { NoteDialog, WeightDialog } from './Dialogs';

interface Props {
  exercise: DayExercise;
  onToggleSelect: () => void;
  onUpdateLog: (fields: LogPatch) => void;
}

export function ExerciseCard({ exercise, onToggleSelect, onUpdateLog }: Props) {
  const { name, isWeighted, lastPerformed, lastWeight, log } = exercise;
  const [dialog, setDialog] = useState<'weight' | 'note' | null>(null);

  const selected = log !== null;
  const completed = log?.completed ?? false;

  const classes = ['card'];
  if (selected) classes.push('selected');
  if (completed) classes.push('completed');

  return (
    <div
      className={classes.join(' ')}
      role="button"
      tabIndex={0}
      onClick={onToggleSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggleSelect();
        }
      }}
    >
      {selected && (
        <label
          className="card-check"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Mark ${name} completed`}
        >
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => onUpdateLog({ completed: e.target.checked })}
          />
          <span className="card-check-box">{completed ? '✓' : ''}</span>
        </label>
      )}

      <div className="card-name">{name}</div>

      <div className="card-last">
        {lastPerformed ? `last: ${formatMDY(lastPerformed)}` : 'never'}
      </div>

      {isWeighted && (
        <div className="card-weight" onClick={(e) => e.stopPropagation()}>
          <span className="card-weight-value">
            {lastWeight != null ? `${lastWeight} lb` : '— lb'}
          </span>
          <button className="card-btn" onClick={() => setDialog('weight')}>
            set
          </button>
        </div>
      )}

      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        {log?.note ? (
          <button className="card-note has-note" onClick={() => setDialog('note')}>
            {log.note}
          </button>
        ) : (
          <button className="card-btn card-note-add" onClick={() => setDialog('note')}>
            + note
          </button>
        )}
      </div>

      {dialog === 'weight' && (
        <WeightDialog
          name={name}
          initial={log?.weight ?? lastWeight}
          onSave={(weight) => {
            onUpdateLog({ weight });
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'note' && (
        <NoteDialog
          name={name}
          initial={log?.note ?? null}
          onSave={(note) => {
            onUpdateLog({ note });
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
}
