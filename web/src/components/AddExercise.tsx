import { useState } from 'react';
import { createExercise } from '../api';

interface Props {
  categories: string[];
  onAdded: () => void;
}

export function AddExercise({ categories, onAdded }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [kind, setKind] = useState<'bodyweight' | 'weighted' | 'run'>('bodyweight');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await createExercise(name.trim(), category.trim(), kind === 'weighted', kind === 'run');
      setName('');
      setKind('bodyweight');
      onAdded();
    } catch (err) {
      setError(String(err).includes('409') ? 'That exercise already exists.' : 'Couldn’t add it.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="add-exercise" onSubmit={submit}>
      <h2>Add Exercise</h2>
      <div className="add-fields">
        <input
          type="text"
          placeholder="exercise name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="category (new or existing)"
          list="category-options"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <select
          className="add-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as 'bodyweight' | 'weighted' | 'run')}
        >
          <option value="bodyweight">bodyweight</option>
          <option value="weighted">weighted</option>
          <option value="run">run</option>
        </select>
        <button type="submit" className="btn-accent" disabled={!name.trim() || !category.trim() || busy}>
          add
        </button>
      </div>
      {error && <div className="add-error">{error}</div>}
    </form>
  );
}
