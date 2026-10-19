import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { LevelInfo } from '../components/LevelTimeline';
import { pick, type Locale } from '../i18n/ui';
import gameLevels from '../data/game/levels.json';
import { maxSkillLevel, totalCost } from './skills';

export const LEVEL_CAP = 45;
/** Уровень умения, на котором открывается первая особенность активного умения. */
const FIRST_SPEC_LEVEL = 8;

/** Данные таблицы опыта клиента по уровню персонажа. */
export function gameLevel(level: number) {
  const row = gameLevels.levels.find((l) => l.level === level);
  if (!row) throw new Error(`Нет данных уровня ${level} в src/data/game/levels.json`);
  return row;
}

/**
 * Собирает по каждому уровню 1..45 всё, что про него известно:
 * новые умения класса, какие умения из приоритета можно поднять, выбор особенностей,
 * доступные очки, общие открытия, зону маршрута и советы из плана прокачки.
 */
export async function buildLevelTimeline(
  plan: CollectionEntry<'levelingPlans'>,
  locale: Locale,
): Promise<LevelInfo[]> {
  const cls = await getEntry(plan.data.class);
  const route = await getEntry(plan.data.route);
  const milestones = await getCollection('milestones');
  if (!cls || !route) throw new Error(`Leveling plan ${plan.id}: unknown class or route`);

  const skillById = new Map(cls.data.skills.map((s) => [s.id, s]));
  const priority = plan.data.skillPriority.map((id) => {
    const skill = skillById.get(id);
    if (!skill) throw new Error(`Leveling plan ${plan.id}: unknown skill in skillPriority: ${id}`);
    if (skill.levelReq.length === 0) throw new Error(`${id}: нет levelReq — запустите scripts/extract-tables.mjs`);
    return skill;
  });

  const levels: LevelInfo[] = [];
  for (let level = 1; level <= LEVEL_CAP; level++) {
    const step = route.data.steps.find((s) => level >= s.fromLevel && level <= s.toLevel);

    const skillUps = priority.flatMap((skill, index) => {
      const before = maxSkillLevel(skill, level - 1);
      const now = maxSkillLevel(skill, level);
      if (now <= before || now < 2) return [];
      return [
        {
          id: skill.id,
          name: pick(skill.name, locale),
          rank: index + 1,
          fromLevel: Math.max(1, before),
          toLevel: now,
          cost: totalCost(skill, now) - totalCost(skill, Math.max(1, before)),
        },
      ];
    });

    const specs = plan.data.specPicks.flatMap((p) => {
      const skill = skillById.get(p.skill);
      if (!skill) throw new Error(`Leveling plan ${plan.id}: unknown skill in specPicks: ${p.skill}`);
      const spec = skill.specs[p.spec];
      if (!spec) throw new Error(`Leveling plan ${plan.id}: ${p.skill} has no spec #${p.spec}`);
      const reachesNow = maxSkillLevel(skill, level) >= spec.level && maxSkillLevel(skill, level - 1) < spec.level;
      if (!reachesNow || spec.level !== FIRST_SPEC_LEVEL) return [];
      return [{ skill: pick(skill.name, locale), spec: pick(spec.text, locale), why: pick(p.why, locale) }];
    });

    // Сколько очков нужно, чтобы все умения из приоритета были на максимуме для этого уровня.
    const needed = priority.reduce((sum, s) => sum + totalCost(s, Math.max(1, maxSkillLevel(s, level))), 0);

    levels.push({
      level,
      zone: step ? pick(step.zone, locale) : null,
      expToNext: level < LEVEL_CAP ? gameLevel(level).expToNext : null,
      // Стигмы открываются все сразу на 22 — показываем их в описании открытия, а не списком.
      newSkills: cls.data.skills
        .filter((s) => s.unlockLevel === level && s.type !== 'stigma')
        .map((s) => ({ id: s.id, name: pick(s.name, locale), type: s.type })),
      skillUps,
      specs,
      points: level >= 4 ? { earned: gameLevel(level).skillPoints, needed } : null,
      unlocks: milestones
        .filter((m) => m.data.level === level)
        .map((m) => ({
          title: pick(m.data.title, locale),
          details: m.data.details ? pick(m.data.details, locale) : null,
        })),
      todo: plan.data.steps
        .filter((s) => s.level === level)
        .flatMap((s) => s.todo.map((item) => pick(item, locale))),
    });
  }
  return levels;
}

