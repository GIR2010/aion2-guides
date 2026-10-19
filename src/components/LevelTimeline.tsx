import { useEffect, useState } from 'react';

export type LevelInfo = {
  level: number;
  zone: string | null;
  newSkills: { id: string; name: string; type: 'active' | 'passive' | 'stigma' }[];
  unlocks: { title: string; details: string | null }[];
  todo: string[];
};

type Labels = {
  level: string;
  pick: string;
  newSkills: string;
  unlocks: string;
  todo: string;
  zone: string;
  nothing: string;
  skillTypes: Record<'active' | 'passive' | 'stigma', string>;
};

type Props = {
  levels: LevelInfo[];
  labels: Labels;
  /** Ключ для запоминания выбранного уровня в браузере. */
  storageKey: string;
};

function readSaved(key: string): number | null {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export default function LevelTimeline({ levels, labels, storageKey }: Props) {
  const min = levels[0]?.level ?? 1;
  const max = levels[levels.length - 1]?.level ?? 45;
  const [level, setLevel] = useState(min);

  useEffect(() => {
    const saved = readSaved(storageKey);
    if (saved !== null && saved >= min && saved <= max) setLevel(saved);
  }, [storageKey, min, max]);

  function choose(next: number) {
    const clamped = Math.min(max, Math.max(min, next));
    setLevel(clamped);
    try {
      localStorage.setItem(storageKey, String(clamped));
    } catch {
      // приватный режим и т. п. — просто не запоминаем
    }
  }

  const info = levels.find((l) => l.level === level);
  const isEmpty = !info || (info.newSkills.length === 0 && info.unlocks.length === 0 && info.todo.length === 0);

  return (
    <section className="timeline card" aria-label={labels.pick}>
      <div className="controls">
        <label htmlFor="lt-range">{labels.pick}</label>
        <div className="row">
          <button type="button" onClick={() => choose(level - 1)} disabled={level <= min} aria-label="−1">
            ‹
          </button>
          <input
            id="lt-range"
            type="range"
            min={min}
            max={max}
            value={level}
            onChange={(e) => choose(Number(e.target.value))}
          />
          <button type="button" onClick={() => choose(level + 1)} disabled={level >= max} aria-label="+1">
            ›
          </button>
          <output className="level-out" htmlFor="lt-range">
            {labels.level} {level}
          </output>
        </div>
      </div>

      {info?.zone && (
        <p>
          <span className="muted">{labels.zone}:</span> <strong>{info.zone}</strong>
        </p>
      )}

      {isEmpty && <p className="muted">{labels.nothing}</p>}

      {info && info.newSkills.length > 0 && (
        <div>
          <h3>{labels.newSkills}</h3>
          <ul className="chips">
            {info.newSkills.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.name}</a> <span className="muted">· {labels.skillTypes[s.type]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {info && info.unlocks.length > 0 && (
        <div>
          <h3>{labels.unlocks}</h3>
          <ul>
            {info.unlocks.map((u) => (
              <li key={u.title}>
                <strong>{u.title}</strong>
                {u.details && <span className="muted"> — {u.details}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {info && info.todo.length > 0 && (
        <div>
          <h3>{labels.todo}</h3>
          <ul>
            {info.todo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .timeline .controls { margin-bottom: 12px; }
        .timeline .row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
        .timeline input[type=range] { flex: 1; min-width: 0; accent-color: var(--accent); }
        .timeline button {
          width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border);
          background: var(--surface-2); color: var(--text); font-size: 1.2rem; cursor: pointer;
        }
        .timeline button:disabled { opacity: .4; cursor: default; }
        .timeline .level-out { font-weight: 700; min-width: 5.5em; text-align: right; }
        .timeline h3 { font-size: 1rem; margin: 16px 0 6px; }
        .timeline .chips { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; }
      `}</style>
    </section>
  );
}
