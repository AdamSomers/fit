import { addDays, dayLabel, formatMDY } from '../dates';

interface Props {
  date: string;
  today: string;
  onNavigate: (date: string) => void;
}

export function DayNav({ date, today, onNavigate }: Props) {
  const atToday = date >= today;
  return (
    <header className="daynav">
      <button
        className="daynav-arrow"
        aria-label="Previous day"
        onClick={() => onNavigate(addDays(date, -1))}
      >
        ‹
      </button>
      <div className="daynav-label">
        <h1>{dayLabel(date, today)}</h1>
        <div className="daynav-date">{formatMDY(date)}</div>
        {date !== today && (
          <button className="daynav-today" onClick={() => onNavigate(today)}>
            jump to today
          </button>
        )}
      </div>
      <button
        className="daynav-arrow"
        aria-label="Next day"
        disabled={atToday}
        onClick={() => onNavigate(addDays(date, 1))}
      >
        ›
      </button>
    </header>
  );
}
