/**
 * «Сборка к уровню»: какие уровни умений и стигм должны быть у персонажа на уровне N,
 * если вкладывать очки строго по плану. Чистые функции — без astro:content, чтобы их можно было тестировать.
 */
import { maxSkillLevel, type SkillLevels } from './skills';

export type BuildSkill = SkillLevels & { id: string };

export type PointAllocation = {
  /** Уровень каждого умения из приоритета (0 — ещё не открыто). */
  levels: Record<string, number>;
  spent: number;
  left: number;
};

/**
 * Вкладывает `budget` очков умений сверху вниз по приоритету.
 * Если на следующий уровень текущего умения очков не хватает, вложения останавливаются:
 * очки копятся под это умение, а не уходят в менее важные.
 */
export function allocatePoints(priority: BuildSkill[], charLevel: number, budget: number): PointAllocation {
  const levels: Record<string, number> = {};
  let left = budget;
  let blocked = false;
  for (const skill of priority) {
    if (skill.unlockLevel > charLevel) {
      levels[skill.id] = 0;
      continue;
    }
    const cap = maxSkillLevel(skill, charLevel);
    let level = 1;
    while (!blocked && level < cap) {
      const cost = skill.levelCost[level];
      if (cost === undefined || cost > left) {
        blocked = true;
        break;
      }
      left -= cost;
      level++;
    }
    levels[skill.id] = level;
  }
  return { levels, spent: budget - left, left };
}

export type StigmaStep = { skill: string; toLevel: number };

export type StigmaAllocation = {
  /** Уровень стигмы по слотам (0 — слот открыт, но стигма ещё не изучена). */
  levels: Record<string, number>;
  left: number;
};

/**
 * Распределяет обломки стигмы по шагам плана. `slots` — стигмы по порядку слотов,
 * `openSlots` — сколько слотов открыто на этом уровне. Шаг для стигмы в закрытом слоте
 * останавливает распределение: обломки копятся под неё.
 */
export function allocateShards(
  stigmas: BuildSkill[],
  slots: string[],
  steps: StigmaStep[],
  openSlots: number,
  budget: number,
): StigmaAllocation {
  const byId = new Map(stigmas.map((s) => [s.id, s]));
  const levels: Record<string, number> = {};
  slots.slice(0, openSlots).forEach((id) => (levels[id] = 0));
  let left = budget;
  for (const step of steps) {
    const skill = byId.get(step.skill);
    if (!skill) throw new Error(`Нет стигмы ${step.skill}`);
    if (slots.indexOf(step.skill) >= openSlots) break;
    let level = levels[step.skill] ?? 0;
    let blocked = false;
    while (level < step.toLevel) {
      // levelCost[0] — изучение стигмы, levelCost[i] — переход на уровень i+1.
      const cost = skill.levelCost[level];
      if (cost === undefined || cost > left) {
        blocked = true;
        break;
      }
      left -= cost;
      level++;
    }
    levels[step.skill] = level;
    if (blocked) break;
  }
  return { levels, left };
}

/** Сумма бонусных очков, доступных к уровню персонажа (например, камни мудрости из подземелий). */
export function bonusUpTo(bonuses: { level: number; count: number }[], charLevel: number): number {
  return bonuses.filter((b) => b.level <= charLevel).reduce((sum, b) => sum + b.count, 0);
}
