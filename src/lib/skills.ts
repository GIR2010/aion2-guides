/**
 * Правила прокачки умений. Данные — из таблицы клиента SkillAcquireData
 * (поля levelReq / levelCost, см. scripts/extract-tables.mjs).
 *
 * Для большинства активных и пассивных умений уровень L доступен с уровня персонажа
 * «открытие + 3·(L − 2)», но это не общее правило: у Бреши в защите, Контракта оживления
 * и Готовности все уровни доступны сразу при открытии. Поэтому считаем только по таблице.
 */

export type SkillLevels = {
  unlockLevel: number;
  levelReq: number[];
  levelCost: number[];
};

/** Очками умений умение поднимается до 10; выше — бонусы экипировки и досок. */
export const MAX_POINT_LEVEL = 10;

/** Цена перехода с уровня `from` на `from + 1`. */
export function levelUpCost(skill: SkillLevels, from: number): number {
  const cost = skill.levelCost[from];
  if (cost === undefined) throw new Error(`Нет цены для уровня ${from + 1}`);
  return cost;
}

/** Сколько стоит поднять умение с 1 уровня до `level` (без цены изучения). */
export function totalCost(skill: SkillLevels, level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += levelUpCost(skill, l);
  return sum;
}

/** Максимальный уровень умения, доступный на уровне персонажа (0 — ещё не открыто). */
export function maxSkillLevel(skill: SkillLevels, charLevel: number, cap = MAX_POINT_LEVEL): number {
  let max = 0;
  for (let i = 0; i < Math.min(cap, skill.levelReq.length); i++) {
    if (skill.levelReq[i] <= charLevel) max = i + 1;
  }
  return max;
}

/** С какого уровня персонажа доступен уровень умения `skillLevel`. */
export function charLevelFor(skill: SkillLevels, skillLevel: number): number {
  const req = skill.levelReq[skillLevel - 1];
  if (req === undefined) throw new Error(`Нет требования для уровня ${skillLevel}`);
  return req;
}
