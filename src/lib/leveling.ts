import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { LevelInfo } from '../components/LevelTimeline';
import { pick, type Locale } from '../i18n/ui';
import { isCostVerified, levelUpCost, maxSkillLevel, totalCost } from './skills';

export const LEVEL_CAP = 45;
/** Уровень навыка, на котором открывается первая особенность активного навыка. */
const FIRST_SPEC_LEVEL = 8;

/**
 * Собирает по каждому уровню 1..45 всё, что про него известно:
 * новые навыки класса, какие навыки из приоритета можно поднять, выбор особенностей,
 * общие открытия, зону маршрута и советы из плана прокачки.
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
    return skill;
  });

  const levels: LevelInfo[] = [];
  for (let level = 1; level <= LEVEL_CAP; level++) {
    const step = route.data.steps.find((s) => level >= s.fromLevel && level <= s.toLevel);

    const skillUps = priority.flatMap((skill, index) => {
      const before = maxSkillLevel(level - 1, skill.unlockLevel);
      const now = maxSkillLevel(level, skill.unlockLevel);
      if (now <= before || now < 2) return [];
      return [
        {
          id: skill.id,
          name: pick(skill.name, locale),
          rank: index + 1,
          toLevel: now,
          cost: levelUpCost(now - 1),
          costVerified: isCostVerified(now - 1),
        },
      ];
    });

    const specs = plan.data.specPicks.flatMap((p) => {
      const skill = skillById.get(p.skill);
      if (!skill) throw new Error(`Leveling plan ${plan.id}: unknown skill in specPicks: ${p.skill}`);
      const spec = skill.specs[p.spec];
      if (!spec) throw new Error(`Leveling plan ${plan.id}: ${p.skill} has no spec #${p.spec}`);
      const reachesNow =
        maxSkillLevel(level, skill.unlockLevel) >= spec.level &&
        maxSkillLevel(level - 1, skill.unlockLevel) < spec.level;
      if (!reachesNow || spec.level !== FIRST_SPEC_LEVEL) return [];
      return [{ skill: pick(skill.name, locale), spec: pick(spec.text, locale), why: pick(p.why, locale) }];
    });

    // Сколько очков нужно, чтобы все навыки из приоритета были на максимуме для этого уровня.
    const budget = priority.reduce((sum, s) => sum + totalCost(maxSkillLevel(level, s.unlockLevel) || 1), 0);

    levels.push({
      level,
      zone: step ? pick(step.zone, locale) : null,
      // Стигмы открываются все сразу на 22 — показываем их в описании открытия, а не списком.
      newSkills: cls.data.skills
        .filter((s) => s.unlockLevel === level && s.type !== 'stigma')
        .map((s) => ({ id: s.id, name: pick(s.name, locale), type: s.type })),
      skillUps,
      specs,
      budget: level >= 4 ? budget : null,
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
