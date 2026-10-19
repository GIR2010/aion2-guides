import { describe, expect, it } from 'vitest';
import assassin from '../data/classes/assassin.json';
import { charLevelFor, levelUpCost, maxSkillLevel, totalCost } from './skills';

const skill = (id: string) => {
  const s = assassin.skills.find((x) => x.id === id);
  if (!s) throw new Error(id);
  return s;
};

// Данные из таблицы клиента сверяем с тем, что показывала игра на скриншотах (персонаж 22 ур.).
describe('стоимость повышения умения совпадает со скриншотами', () => {
  it.each([
    // [умение, текущий уровень, цена в игре]
    ['flash-slice', 1, 1],
    ['ambush-stance', 3, 1],
    ['insignia-explosion', 4, 2],
    ['shadowstrike', 5, 2],
    ['savage-roar', 6, 2],
    ['quick-slice', 7, 4],
    ['ambush', 8, 4],
    ['exploit-weakness', 5, 2],
    ['defense-break', 4, 2],
  ])('%s: ур. %i → +1 стоит %i', (id, from, cost) => {
    expect(levelUpCost(skill(id), from)).toBe(cost);
  });

  it('с 1 до 10 уровня — 21 очко', () => {
    expect(totalCost(skill('quick-slice'), 10)).toBe(21);
  });
});

describe('ограничение по уровню персонажа совпадает со скриншотами', () => {
  it.each([
    // [умение, следующий уровень, «Можно изучить на ур. перс.»]
    ['ambush', 9, 24],
    ['storm-rampage', 8, 23],
    ['insignia-explosion', 5, 23],
    ['rear-smite', 6, 23],
    ['assault-stance', 6, 25],
    ['ambush-stance', 4, 23],
  ])('%s: ур. %i → ур. перс. %i', (id, skillLevel, charLevel) => {
    expect(charLevelFor(skill(id), skillLevel)).toBe(charLevel);
    expect(maxSkillLevel(skill(id), charLevel - 1)).toBe(skillLevel - 1);
  });

  it('на 22 уровне доступны уровни, которые игра позволила поднять', () => {
    expect(maxSkillLevel(skill('quick-slice'), 22)).toBeGreaterThanOrEqual(8);
    expect(maxSkillLevel(skill('defense-break'), 22)).toBe(10);
  });

  it('пассивные умения 23 и 25 ур. на 22 уровне закрыты', () => {
    expect(maxSkillLevel(skill('revitalization-contract'), 22)).toBe(0);
    expect(maxSkillLevel(skill('determination'), 22)).toBe(0);
  });
});

describe('стигмы', () => {
  it('изучение — 1 обломок, до 20 уровня — 75', () => {
    const s = skill('savage-fang');
    expect(s.levelCost[0]).toBe(1);
    expect(s.levelCost[0] + totalCost(s, 20)).toBe(75);
  });
});
