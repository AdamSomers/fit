export interface DayLog {
  completed: boolean;
  weight: number | null;
  note: string | null;
}

export interface DayExercise {
  id: number;
  name: string;
  isWeighted: boolean;
  lastPerformed: string | null;
  lastWeight: number | null;
  log: DayLog | null;
}

export interface DaySection {
  id: number;
  name: string;
  exercises: DayExercise[];
}

export interface DayPayload {
  date: string;
  sections: DaySection[];
}
