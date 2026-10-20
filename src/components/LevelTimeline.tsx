import { useEffect, useState } from 'react';

export type LevelInfo = {
  level: number;
  zone: string | null;
  /** Опыт до следующего уровня (таблица клиента). */
  expToNext: number | null;
  newSkills: { id: string; name: string; icon: string | null; type: 'active' | 'passive' | 'stigma' }[];
  /** Умения из списка приоритета, чей максимальный уровень вырос на этом уровне персонажа. */
  skillUps: { id: string; name: string; icon: string | null; rank: number; fromLevel: number; toLevel: number; cost: number }[];
  /** Рекомендованные особенности, которые открываются на этом уровне. */
  specs: { skill: string; spec: string; why: string }[];
  /** Очки умений: получено за уровни (таблица клиента) и нужно, чтобы держать приоритетные умения на максимуме. */
  points: { earned: number; needed: number } | null;
  unlocks: { title: string; details: string | null }[];
  todo: string[];
  /** Что поменять в связках, стигмах и досках по сравнению с прошлым уровнем. */
  changes: string[];
  /** Полное состояние персонажа на этом уровне — чтобы выставить всё сразу. */
  build: {
    budgets: {
      key: 'levels' | 'stones';
      total: number;
      left: number;
      skills: { id: string; rank: number; name: string; icon: string | null; level: number; cap: number; spec: string | null }[];
    }[];
    others: string[];
    stigmas: { slot: number; name: string; icon: string | null; level: number }[];
    shards: { total: number; left: number } | null;
    macros: { name: string; slots: { name: string; icon: string | null }[] }[];
    daevanion: string[];
  };
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
  changes: string;
  build: string;
  buildHint: string;
  budgetLevels: string;
  budgetStones: string;
  pointsLeft: string;
  cap: string;
  others: string;
  stigmas: string;
  stigmaSlot: string;
  notLearned: string;
  shards: string;
  macros: string;
  daevanion: string;
  skillTypes: Record<'active' | 'passive' | 'stigma', string>;
};

type Props = {
  levels: LevelInfo[];
  labels: Labels;
  /** Ключ для запоминания выбранного уровня в браузере. */
  storageKey: string;
};

/** Иконка умения рядом с названием; без файла иконки — ничего. */
function Icon({ src, title }: { src: string | null; title?: string }) {
  if (!src) return null;
  return <img className="icon" src={src} width={24} height={24} alt={title ?? ''} title={title} loading="lazy" decoding="async" />;
}

function readBudget(key: string): 'levels' | 'stones' {
  try {
    return localStorage.getItem(key) === 'levels' ? 'levels' : 'stones';
  } catch {
    return 'stones';
  }
}

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
  const [budgetKey, setBudgetKey] = useState<'levels' | 'stones'>('stones');

  useEffect(() => {
    const saved = readSaved(storageKey);
    if (saved !== null && saved >= min && saved <= max) setLevel(saved);
    setBudgetKey(readBudget(`${storageKey}:budget`));
  }, [storageKey, min, max]);

  function chooseBudget(next: 'levels' | 'stones') {
    setBudgetKey(next);
    try {
      localStorage.setItem(`${storageKey}:budget`, next);
    } catch {
      // не запоминаем
    }
  }

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
      info.todo.length === 0 &&
      info.changes.length === 0);
  const budgets = info?.build.budgets ?? [];
  const budget = budgets.find((b) => b.key === budgetKey) ?? budgets[0];

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
                <Icon src={s.icon} /> <a href={`#${s.id}`}>{s.name}</a> <span className="muted">· {labels.skillTypes[s.type]}</span>
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
                <span className="rank">#{u.rank}</span> <Icon src={u.icon} /> <a href={`#${u.id}`}>{u.name}</a> → <strong>{u.toLevel}</strong>{' '}
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

      {info && info.changes.length > 0 && (
        <div>
          <h3>{labels.changes}</h3>
          <ul>
            {info.changes.map((item) => (
              <li key={item}>{item}</li>
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

      {info && (
        <div className="build">
          <h3>
            {labels.build} {info.level}
          </h3>
          <p className="muted hint">{labels.buildHint}</p>

          {budgets.length > 1 && (
            <div className="budget-switch" role="radiogroup">
              {budgets.map((b) => (
                <label key={b.key}>
                  <input
                    type="radio"
                    name={`${storageKey}-budget`}
                    checked={budget?.key === b.key}
                    onChange={() => chooseBudget(b.key)}
                  />{' '}
                  {b.key === 'levels' ? labels.budgetLevels : labels.budgetStones} ({b.total} {labels.points})
                </label>
              ))}
            </div>
          )}

          {budget && budget.skills.length > 0 && (
            <>
              <table className="build-table">
                <tbody>
                  {budget.skills.map((s) => (
                    <tr key={s.id} className={s.level < s.cap ? 'behind' : undefined}>
                      <td className="rank">#{s.rank}</td>
                      <td>
                        <Icon src={s.icon} /> <a href={`#${s.id}`}>{s.name}</a>
                        {s.spec && <div className="muted spec">«{s.spec}»</div>}
                      </td>
                      <td className="lv">
                        <strong>{s.level}</strong>
                        {s.level < s.cap && (
                          <span className="muted">
                            {' '}
                            / {labels.cap} {s.cap}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted hint">
                {labels.pointsLeft}: {budget.left} {labels.points}
              </p>
            </>
          )}
          {info.build.others.length > 0 && (
            <p className="muted hint">
              {labels.others}: {info.build.others.join(', ')}
            </p>
          )}

          {info.build.stigmas.length > 0 && (
            <>
              <h4>{labels.stigmas}</h4>
              <ul>
                {info.build.stigmas.map((s) => (
                  <li key={s.slot}>
                    {labels.stigmaSlot} {s.slot}: <Icon src={s.icon} /> <strong>{s.name}</strong>{' '}
                    {s.level > 0 ? (
                      <>
                        — {labels.level.toLowerCase()} <strong>{s.level}</strong>
                      </>
                    ) : (
                      <span className="muted">— {labels.notLearned}</span>
                    )}
                  </li>
                ))}
              </ul>
              {info.build.shards && (
                <p className="muted hint">
                  {labels.shards}: {info.build.shards.total}, {labels.pointsLeft}: {info.build.shards.left}
                </p>
              )}
            </>
          )}

          {info.build.macros.length > 0 && (
            <>
              <h4>{labels.macros}</h4>
              <ul>
                {info.build.macros.map((m) => (
                  <li key={m.name}>
                    <strong>{m.name}</strong>:{' '}
                    {m.slots.map((slot, i) => (
                      <span key={slot.name} className="macro-slot">
                        {i > 0 && ' → '}
                        <Icon src={slot.icon} /> {slot.name}
                      </span>
                    ))}
                  </li>
                ))}
              </ul>
            </>
          )}

          {info.build.daevanion.length > 0 && (
            <>
              <h4>{labels.daevanion}</h4>
              <ul>
                {info.build.daevanion.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </>
          )}
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
        .timeline .icon { width: 24px; height: 24px; border-radius: 4px; vertical-align: middle; box-shadow: 0 0 0 1px var(--border); }
        .timeline .chips .icon, .timeline .ups .icon, .timeline .build-table .icon { margin-right: 2px; }
        .timeline .macro-slot { white-space: nowrap; }
        .timeline .build { border-top: 1px solid var(--border); margin-top: 16px; padding-top: 4px; }
        .timeline h4 { font-size: .95rem; margin: 14px 0 4px; }
        .timeline .budget-switch { display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 4px 0 8px; font-size: .9rem; }
        .timeline .build-table { width: 100%; border-collapse: collapse; font-size: .95rem; }
        .timeline .build-table td { padding: 3px 6px 3px 0; border-bottom: 1px solid var(--border); vertical-align: top; }
        .timeline .build-table .lv { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .timeline .build-table .spec { font-size: .82rem; }
        .timeline .budget { font-size: .85rem; border-top: 1px solid var(--border); padding-top: 10px; margin-top: 16px; }
      `}</style>
    </section>
  );
}
