import { Fragment, useEffect, useState } from 'react';
import { fetchHistory } from '../api';
import { formatMDY } from '../dates';
import { runSummary } from '../run';
import type { DayLog, HistoryPayload } from '../types';

interface Props {
  today: string;
  onBack: () => void;
}

/** Cell text: the most informative compact datum for that day's completed log. */
function cellText(log: DayLog): string {
  if (!log.completed) return '';
  if (log.weight != null) return String(log.weight);
  if (log.distance != null) return String(log.distance);
  if (log.timeSeconds != null) return `${Math.round(log.timeSeconds / 60)}m`;
  return '✓';
}

function cellTitle(name: string, date: string, log: DayLog): string {
  const parts = [`${name} · ${formatMDY(date)}`];
  if (log.weight != null) parts.push(`${log.weight} lb`);
  const run = runSummary(log);
  if (run) parts.push(run);
  if (log.note) parts.push(log.note);
  return parts.join(' — ');
}

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dayHeader(date: string): { top: string; bottom: string } {
  const [y, m, d] = date.split('-').map(Number);
  return {
    top: WEEKDAY_LETTERS[new Date(y, m - 1, d).getDay()],
    bottom: `${m}/${d}`,
  };
}

export function HistoryPage({ today, onBack }: Props) {
  const [payload, setPayload] = useState<HistoryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    fetchHistory(today)
      .then(setPayload)
      .catch((e) => setError(String(e)));
  };

  useEffect(load, [today]);

  return (
    <div className="app history-app">
      <header className="daynav">
        <button className="daynav-arrow" aria-label="Back" onClick={onBack}>
          ‹
        </button>
        <div className="daynav-label">
          <h1>History</h1>
          <div className="daynav-date">newest → oldest</div>
        </div>
        <div className="daynav-spacer" />
      </header>
      {error && (
        <div className="error">
          Couldn’t reach the server. <button onClick={load}>Retry</button>
        </div>
      )}
      {payload && (
        <div className="history-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th className="history-name-col" />
                {payload.days.map((day) => {
                  const h = dayHeader(day);
                  return (
                    <th key={day} className={day === today ? 'history-today' : ''}>
                      <span className="history-dow">{h.top}</span>
                      <span className="history-md">{h.bottom}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {payload.sections.map((section) => (
                <Fragment key={section.id}>
                  <tr className="history-cat-row">
                    <td className="history-name-col history-cat" colSpan={payload.days.length + 1}>
                      {section.name}
                    </td>
                  </tr>
                  {section.exercises.map((ex) => (
                    <tr key={ex.id}>
                      <td className={`history-name-col history-name${ex.active ? '' : ' inactive'}`}>
                        {ex.name}
                      </td>
                      {payload.days.map((day) => {
                        const log = ex.logs[day];
                        return (
                          <td
                            key={day}
                            className={`history-cell${log?.completed ? ' done' : ''}${
                              day === today ? ' history-today' : ''
                            }`}
                            title={log ? cellTitle(ex.name, day, log) : undefined}
                          >
                            {log ? cellText(log) : ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
