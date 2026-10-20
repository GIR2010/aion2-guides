import { describe, expect, it } from 'vitest';
import assassin from '../data/classes/assassin.json';
import plan from '../data/leveling/assassin-asmodian.json';
import { allocatePoints, allocateShards, bonusUpTo } from './build';

const skill = (id: string) => {
  const s = assassin.skills.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};
const priority = plan.skillPriority.map(skill);
const stigmas = assassin.skills.filter((s) => s.type === 'stigma');

describe('allocatePoints', () => {
  it('не тратит больше бюджета и не превышает предел уровня', () => {
    const a = allocatePoints(priority, 30, 111);
    expect(a.spent + a.left).toBe(111);
    expect(a.levels['quick-slice']).toBe(10);
    expect(a.levels['savage-roar']).toBe(10);
  });

  it('не открытые умения — 0', () => {
    expect(allocatePoints(priority, 10, 16).levels['insignia-explosion']).toBe(0);
  });

  it('при нехватке очков копит под текущее умение, а не тратит на следующие', () => {
    // На 4 уровне 1 очко: Быстрый разрез 1 → 2, остальным ничего.
    const a = allocatePoints(priority, 4, 1);
    expect(a.levels['quick-slice']).toBe(2);
    expect(a.levels['savage-roar']).toBe(1);
    expect(a.left).toBe(0);
  });
});

describe('allocateShards', () => {
  const { slots, shards } = plan.stigmaPlan;

  it('на 27 уровне (5 обломков, 2 слота) — Клык хищника до 5', () => {
    const a = allocateShards(stigmas, slots, shards, 2, 5);
    expect(a.levels['savage-fang']).toBe(5);
    expect(a.levels['illusive-clone']).toBe(0);
  });

  it('на 45 уровне (29 обломков) — план из гайда: 16 на четыре стигмы и 10 в Клык до 10', () => {
    const a = allocateShards(stigmas, slots, shards, 4, 29);
    expect(a.levels).toEqual({ 'savage-fang': 10, 'illusive-clone': 5, 'swift-contract': 5, 'assault-ambush': 1 });
    expect(a.left).toBe(3);
  });

  it('стигма в закрытом слоте не получает обломков', () => {
    const a = allocateShards(stigmas, slots, shards, 1, 15);
    expect(a.levels).toEqual({ 'savage-fang': 5 });
    expect(a.left).toBe(10);
  });
});

describe('связки плана', () => {
  const slots = plan.macros.flatMap((m) => m.slots);

  it('каждое умение стоит только в одной ячейке', () => {
    expect(new Set(slots).size).toBe(slots.length);
  });

  it('Быстрый разрез закреплён за ЛКМ и в связки не входит', () => {
    expect(slots).not.toContain('quick-slice');
  });

  it('в связке не больше 4 ячеек', () => {
    for (const m of plan.macros) expect(m.slots.length).toBeLessThanOrEqual(4);
  });
});

describe('bonusUpTo', () => {
  it('камни мудрости из запечатанных подземелий — 120 к 40 уровню', () => {
    expect(bonusUpTo(plan.wisdomStones, 9)).toBe(0);
    expect(bonusUpTo(plan.wisdomStones, 40)).toBe(120);
  });
});
