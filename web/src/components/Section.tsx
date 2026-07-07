import type { LogPatch } from '../api';
import type { DaySection } from '../types';
import { ExerciseCard } from './ExerciseCard';

interface Props {
  section: DaySection;
  onToggleSelect: (exerciseId: number) => void;
  onUpdateLog: (exerciseId: number, fields: LogPatch) => void;
}

export function Section({ section, onToggleSelect, onUpdateLog }: Props) {
  return (
    <section className="section">
      <h2>{section.name}</h2>
      <div className="grid">
        {section.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onToggleSelect={() => onToggleSelect(ex.id)}
            onUpdateLog={(fields) => onUpdateLog(ex.id, fields)}
          />
        ))}
      </div>
    </section>
  );
}
