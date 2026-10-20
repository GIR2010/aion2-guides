import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { LevelInfo } from '../components/LevelTimeline';
import { pick, t, type Locale } from '../i18n/ui';
import gameLevels from '../data/game/levels.json';
import { maxSkillLevel, totalCost } from './skills';
import { allocatePoints, allocateShards, bonusUpTo } from './build';
import { skillIconUrl } from './icons';

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

  const stigmas = cls.data.skills.filter((s) => s.type === 'stigma');
  const stigmaPlan = plan.data.stigmaPlan;
  const prioritySet = new Set(plan.data.skillPriority);
  const name = (id: string) => {
    const skill = skillById.get(id);
    if (!skill) throw new Error(`Leveling plan ${plan.id}: unknown skill ${id}`);
    return pick(skill.name, locale);
  };
  const icon = (id: string) => skillIconUrl(cls.id, id);
  const fill = (template: string, values: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ''));

  // В игре умение можно поставить только в одну ячейку одной связки.
  const macroSkills = plan.data.macros.flatMap((m) => m.slots);
  const repeated = macroSkills.find((id, i) => macroSkills.indexOf(id) !== i);
  if (repeated) throw new Error(`Leveling plan ${plan.id}: ${repeated} стоит в нескольких ячейках связок`);

  /** Связки на уровне: только открытые умения, снизу вверх. Связка из одного умения не нужна. */
  const macrosAt = (level: number) =>
    plan.data.macros
      .filter((m) => level >= m.fromLevel)
      .map((m) => ({
        name: pick(m.name, locale),
        slots: m.slots.filter((id) => (skillById.get(id)?.unlockLevel ?? Infinity) <= level),
      }))
      .filter((m) => m.slots.length >= 2);

  const skillsBuild = (level: number, budget: number) => {
    const a = allocatePoints(priority, level, budget);
    return {
      total: budget,
      left: a.left,
      skills: priority
        .map((s, index) => ({ s, rank: index + 1 }))
        .filter(({ s }) => s.unlockLevel <= level)
        .map(({ s, rank }) => {
          const lv = a.levels[s.id] ?? 1;
          const picks = plan.data.specPicks
            .filter((p) => p.skill === s.id && (s.specs[p.spec]?.level ?? Infinity) <= lv)
            .map((p) => pick(s.specs[p.spec]!.text, locale));
          return { id: s.id, rank, name: pick(s.name, locale), icon: icon(s.id), level: lv, cap: maxSkillLevel(s, level), spec: picks[0] ?? null };
        }),
    };
  };

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
          icon: icon(skill.id),
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

    const earned = level >= 4 ? gameLevel(level).skillPoints : 0;
    const stones = level >= 4 ? bonusUpTo(plan.data.wisdomStones, level) : 0;
    const openSlots = gameLevel(level).stigmaSlots;
    const shardsTotal = gameLevel(level).stigmaShards;
    const shards =
      stigmaPlan && openSlots > 0
        ? allocateShards(stigmas, stigmaPlan.slots, stigmaPlan.shards, openSlots, shardsTotal)
        : null;
    const macros = macrosAt(level);

    // Что поменять в раскладке по сравнению с прошлым уровнем.
    const changes: string[] = [];
    const prevMacros = macrosAt(level - 1);
    for (const m of macros) {
      const before = prevMacros.find((p) => p.name === m.name);
      if (!before) {
        changes.push(fill(t(locale, 'timeline.chMacroNew'), { macro: m.name, list: m.slots.map(name).join(' → ') }));
        continue;
      }
      m.slots.forEach((id, i) => {
        if (!before.slots.includes(id))
          changes.push(fill(t(locale, 'timeline.chMacroAdd'), { macro: m.name, skill: name(id), slot: i }));
      });
    }
    const prevSlots = level > 1 ? gameLevel(level - 1).stigmaSlots : 0;
    for (let i = prevSlots; stigmaPlan && i < openSlots; i++) {
      const id = stigmaPlan.slots[i];
      if (id) changes.push(fill(t(locale, 'timeline.chStigma'), { slot: i + 1, skill: name(id) }));
    }
    for (const d of plan.data.daevanion.filter((d) => d.level === level)) changes.push(pick(d.text, locale));

    levels.push({
      level,
      changes,
      build: {
        budgets: [
          { key: 'levels', ...skillsBuild(level, earned) },
          ...(stones > 0 ? [{ key: 'stones' as const, ...skillsBuild(level, earned + stones) }] : []),
        ],
        others: cls.data.skills
          .filter((s) => s.type !== 'stigma' && s.unlockLevel <= level && !prioritySet.has(s.id))
          .map((s) => pick(s.name, locale)),
        stigmas:
          shards && stigmaPlan
            ? stigmaPlan.slots
                .slice(0, openSlots)
                .map((id, i) => ({ slot: i + 1, name: name(id), icon: icon(id), level: shards.levels[id] ?? 0 }))
            : [],
        shards: shards ? { total: shardsTotal, left: shards.left } : null,
        macros: macros.map((m) => ({ name: m.name, slots: m.slots.map((id) => ({ name: name(id), icon: icon(id) })) })),
        daevanion: plan.data.daevanion.filter((d) => d.level <= level).map((d) => pick(d.text, locale)),
      },
      zone: step ? pick(step.zone, locale) : null,
      expToNext: level < LEVEL_CAP ? gameLevel(level).expToNext : null,
      // Стигмы открываются все сразу на 22 — показываем их в описании открытия, а не списком.
      newSkills: cls.data.skills
        .filter((s) => s.unlockLevel === level && s.type !== 'stigma')
        .map((s) => ({ id: s.id, name: pick(s.name, locale), icon: icon(s.id), type: s.type })),
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

