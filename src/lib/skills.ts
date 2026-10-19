/**
 * Правила прокачки навыков очками навыков (до 10 уровня).
 *
 * Выведены из скриншотов окна «Умения» (персонаж 22 ур., 19.10.2026):
 * - стоимость повышения: ур. 1→4 — 1 очко, 4→7 — 2 очка, 7→9 — 4 очка
 *   (9→10 на скриншотах не было — считаем 4 по той же лестнице, НЕ ПРОВЕРЕНО);
 * - ограничение: ур. навыка L доступен с ур. персонажа `открытие + 3·(L − 2)`.
 *   Совпало на всех 6 навыках, где игра показала «Можно изучить на ур. перс. N».
 */

export const MAX_POINT_LEVEL = 10;

/** Стоимость повышения навыка с уровня `from` до `from + 1`. */
export function levelUpCost(from: number): number {
  if (from < 4) return 1;
  if (from < 7) return 2;
  return 4;
}

/** Есть ли для перехода `from → from + 1` подтверждение скриншотом. */
export function isCostVerified(from: number): boolean {
  return from <= 8;
}

/** Сколько очков стоит прокачать навык с 1 уровня до `level`. */
export function totalCost(level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += levelUpCost(l);
  return sum;
}

/** Максимальный уровень навыка (за очки), доступный на уровне персонажа. */
export function maxSkillLevel(charLevel: number, unlockLevel: number): number {
  if (charLevel < unlockLevel) return 0;
  return Math.min(MAX_POINT_LEVEL, Math.floor((charLevel - unlockLevel) / 3) + 2);
}

/** С какого уровня персонажа доступен уровень навыка `skillLevel`. */
export function charLevelFor(skillLevel: number, unlockLevel: number): number {
  return skillLevel <= 2 ? unlockLevel : unlockLevel + 3 * (skillLevel - 2);
}
