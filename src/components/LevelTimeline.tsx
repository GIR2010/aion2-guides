import { useEffect, useState } from 'react';

export type LevelInfo = {
  level: number;
  zone: string | null;
  /** Опыт до следующего уровня (таблица клиента). */
  expToNext: number | null;
  newSkills: { id: string; name: string; type: 'active' | 'passive' | 'stigma' }[];
  /** Умения из списка приоритета, чей максимальный уровень вырос на этом уровне персонажа. */
  skillUps: { id: string; name: string; rank: number; fromLevel: number; toLevel: number; cost: number }[];
  /** Рекомендованные особенности, которые открываются на этом уровне. */
  specs: { skill: string; spec: string; why: string }[];
  /** Очки умений: получено за уровни (таблица клиента) и нужно, чтобы держать приоритетные умения на максимуме. */
  points: { earned: number; needed: number } | null;
  unlocks: { title: string; details: string | null }[];
  todo: string[];
};

type Labels = {
  level: string;
  pick: string;
  newSkills: string;
  skillUps: string;
  skillUpsHint: string;
  points: string;
  specs: string;
  pointsEarned: string;
  pointsNeeded: string;
  pointsHint: string;
  unlocks: string;
  todo: string;
  zone: string;
  exp: string;
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
  const isEmpty =
    !info ||
    (info.newSkills.length === 0 &&
      info.skillUps.length === 0 &&
      info.specs.length === 0 &&
      info.unlocks.length === 0 &&
      info.todo.length === 0);

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
          {info.expToNext != null && (
            <span className="muted">
              {' · '}
              {labels.exp}: {info.expToNext.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            </span>
          )}
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

      {info && info.skillUps.length > 0 && (
        <div>
          <h3>{labels.skillUps}</h3>
          <p className="muted hint">{labels.skillUpsHint}</p>
          <ol className="ups">
            {info.skillUps.map((u) => (
              <li key={u.id}>
                <span className="rank">#{u.rank}</span> <a href={`#${u.id}`}>{u.name}</a> → <strong>{u.toLevel}</strong>{' '}
                <span className="muted">
                  ({u.cost} {labels.points})
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {info && info.specs.length > 0 && (
        <div>
          <h3>{labels.specs}</h3>
          <ul>
            {info.specs.map((s) => (
              <li key={s.skill}>
                <strong>{s.skill}</strong>: «{s.spec}» <span className="muted">— {s.why}</span>
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

      {info?.points && (
        <div className="muted budget">
          <div>
            {labels.pointsEarned}: <strong>{info.points.earned}</strong> · {labels.pointsNeeded}:{' '}
            <strong>{info.points.needed}</strong>
          </div>
          <div className="hint">{labels.pointsHint}</div>
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
        .timeline .hint { font-size: .85rem; margin: 0 0 6px; }
        .timeline .chips { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; }
        .timeline .ups { list-style: none; padding: 0; margin: 0; }
        .timeline .ups li { padding: 2px 0; }
        .timeline .rank { display: inline-block; min-width: 2.2em; color: var(--muted); font-variant-numeric: tabular-nums; }
        .timeline .budget { font-size: .85rem; border-top: 1px solid var(--border); padding-top: 10px; margin-top: 16px; }
      `}</style>
    </section>
  );
}
