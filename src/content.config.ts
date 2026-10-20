import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Текст на двух языках. `ru: null` — официальное русское название ещё не подтверждено. */
const text = z.object({
  ru: z.string().nullable(),
  en: z.string().nullable(),
});

/**
 * Насколько можно доверять факту:
 * verified — проверено в игре (скриншот), multi-source — 2+ независимых источника,
 * single-source — один источник, unknown — данных нет.
 */
const status = z.enum(['verified', 'multi-source', 'single-source', 'unknown']);

const factMeta = {
  status,
  sources: z.array(reference('sources')).default([]),
};

const sources = defineCollection({
  loader: file('src/data/sources.json'),
  schema: z.object({
    title: z.string(),
    url: z.url().optional(),
    kind: z.enum(['official', 'database', 'guide', 'wiki', 'in-game']),
  }),
});

const skill = z.object({
  id: z.string(),
  /** ID навыка в клиенте (ключи текстов SkillString_STR_SKILL_PC_<CLASS>_<gameId>_*). */
  gameId: z.number().int().optional(),
  type: z.enum(['active', 'passive', 'stigma']),
  /** Уровень персонажа, на котором навык открывается. Для стигм — 22. */
  unlockLevel: z.number().int().min(1).max(60),
  /** Перезарядка в секундах; null — без перезарядки. */
  cooldown: z.number().nullable(),
  /** Затрата ОМ (маны); null — не тратит. */
  mpCost: z.number().nullable().default(null),
  name: text,
  effect: text,
  /**
   * Уникальные особенности (специализации): открываются на уровне навыка `level`
   * (активные — 8/12/16, стигмы — 5/10/15/20). Тексты в игре обрезаны, поэтому краткие.
   */
  specs: z.array(z.object({ level: z.number().int(), text })).default([]),
  /** Пометка о расхождениях или непроверенных деталях. */
  note: text.optional(),
  /**
   * Из таблицы клиента SkillAcquireData (scripts/extract-tables.mjs):
   * levelReq[i] — уровень персонажа, с которого доступен уровень умения i+1;
   * levelCost[i] — цена перехода на уровень i+1 (очки умений; для стигм — обломки стигмы,
   * levelCost[0] — изучение).
   */
  levelReq: z.array(z.number().int()).default([]),
  levelCost: z.array(z.number().int()).default([]),
  /** Ступень пробуждения, нужная для изучения (у стигм — AscensionGrade_3). */
  learnAscension: z.string().optional(),
  ...factMeta,
});

const classes = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/classes' }),
  schema: z.object({
    name: text,
    /** Код класса в клиенте: ASSASSIN, GLADIATOR, … */
    gameClass: z.string().optional(),
    role: z.enum(['melee-dps', 'ranged-dps', 'magic-dps', 'tank', 'healer', 'support']),
    weapon: text,
    difficulty: z.enum(['easy', 'medium', 'hard']),
    summary: text,
    order: z.number().int(),
    skills: z.array(skill),
  }),
});

/** Общие для всех классов открытия по уровням: доски Daevanion, слоты стигм и т. п. */
const milestones = defineCollection({
  loader: file('src/data/milestones.json'),
  schema: z.object({
    level: z.number().int(),
    title: text,
    details: text.optional(),
    ...factMeta,
  }),
});

/** Маршрут прокачки фракции: какие зоны и главы сюжета на каких уровнях. */
const routes = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/routes' }),
  schema: z.object({
    faction: z.enum(['asmodian', 'elyos']),
    name: text,
    steps: z.array(
      z.object({
        fromLevel: z.number().int(),
        toLevel: z.number().int(),
        zone: text,
        notes: text.optional(),
        ...factMeta,
      }),
    ),
  }),
});

/** Пошаговый план прокачки класса: советы на конкретных уровнях. */
const levelingPlans = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/leveling' }),
  schema: z.object({
    class: reference('classes'),
    route: reference('routes'),
    /** Порядок вложения очков навыков: id навыков от важного к неважному. */
    skillPriority: z.array(z.string()),
    /** Какую особенность брать, когда навык дойдёт до её уровня. `spec` — индекс в `skills[].specs`. */
    specPicks: z
      .array(z.object({ skill: z.string(), spec: z.number().int(), why: text }))
      .default([]),
    /** Камни мудрости (+1 очко умения) из запечатанных подземелий по рекомендуемому уровню (RewardDungeon *_02). */
    wisdomStones: z.array(z.object({ level: z.number().int(), count: z.number().int() })).default([]),
    /** Стигмы по порядку слотов и порядок вложения обломков. */
    stigmaPlan: z
      .object({
        slots: z.array(z.string()),
        shards: z.array(z.object({ skill: z.string(), toLevel: z.number().int() })),
      })
      .optional(),
    /** Связки: `slots` — снизу вверх (первый — высший приоритет). Умение показывается, когда оно открыто. */
    macros: z
      .array(z.object({ name: text, fromLevel: z.number().int().default(1), slots: z.array(z.string()) }))
      .default([]),
    /** Что брать на досках Даэваниона, начиная с уровня. */
    daevanion: z.array(z.object({ level: z.number().int(), text })).default([]),
    steps: z.array(
      z.object({
        level: z.number().int(),
        todo: z.array(text),
        ...factMeta,
      }),
    ),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['ru', 'en']),
    /** Общий ключ для связи переводов одного гайда. */
    translationKey: z.string(),
    class: reference('classes').optional(),
    order: z.number().int().default(100),
    draft: z.boolean().default(false),
    updated: z.coerce.date(),
    /** Сборка клиента, на которой проверялись данные (см. Manifest в папке игры). */
    verifiedPatch: z.string().nullable().default(null),
  }),
});

export const collections = { sources, classes, milestones, routes, levelingPlans, guides };
