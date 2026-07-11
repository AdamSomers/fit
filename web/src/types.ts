export interface DayLog {
  completed: boolean;
  weight: number | null;
  note: string | null;
  distance: number | null;
  timeSeconds: number | null;
  elevationFt: number | null;
}

export interface DayExercise {
  id: number;
  name: string;
  isWeighted: boolean;
  isRun: boolean;
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

export interface LibraryExercise {
  id: number;
  name: string;
  category: string;
  isWeighted: boolean;
  active: boolean;
}
