import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { LevelInfo } from '../components/LevelTimeline';
import { pick, type Locale } from '../i18n/ui';

export const LEVEL_CAP = 45;

/**
 * Собирает по каждому уровню 1..45 всё, что про него известно:
 * новые навыки класса, общие открытия, зону маршрута и советы из плана прокачки.
 */
export async function buildLevelTimeline(
  plan: CollectionEntry<'levelingPlans'>,
  locale: Locale,
): Promise<LevelInfo[]> {
  const cls = await getEntry(plan.data.class);
  const route = await getEntry(plan.data.route);
  const milestones = await getCollection('milestones');
  if (!cls || !route) throw new Error(`Leveling plan ${plan.id}: unknown class or route`);

  const levels: LevelInfo[] = [];
  for (let level = 1; level <= LEVEL_CAP; level++) {
    const step = route.data.steps.find((s) => level >= s.fromLevel && level <= s.toLevel);
    levels.push({
      level,
      zone: step ? pick(step.zone, locale) : null,
      // Стигмы открываются все сразу на 22 — показываем их в описании открытия, а не списком.
      newSkills: cls.data.skills
        .filter((s) => s.unlockLevel === level && s.type !== 'stigma')
        .map((s) => ({ id: s.id, name: pick(s.name, locale), type: s.type })),
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
