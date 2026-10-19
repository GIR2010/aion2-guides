#!/usr/bin/env node
/**
 * Подтягивает официальные названия навыков и тексты особенностей (RU/EN)
 * из выгрузки текстов клиента в src/data/classes/*.json.
 *
 * Выгрузка лежит в raw/ (не в git). Путь по умолчанию — самая свежая папка
 * raw/client/*, можно задать явно: AION2_RAW=raw/client/steam-25926599
 *
 *   node scripts/sync-game-text.mjs            — показать расхождения
 *   node scripts/sync-game-text.mjs --write    — записать изменения
 *   node scripts/sync-game-text.mjs --desc     — дополнительно вывести описания навыков из игры
 *
 * Ключи текстов: SkillString_STR_SKILL_PC_<CLASS>_<gameId>_skill_name,
 * особенности — <gameId + 10·N>_specialized_skill_desc (N = 1..5 по порядку в игре).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const args = new Set(process.argv.slice(2));

function latestRawDir() {
  const base = join(root, 'raw', 'client');
  const dirs = readdirSync(base)
    .map((name) => join(base, name))
    .filter((p) => statSync(p).isDirectory())
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  if (dirs.length === 0) throw new Error(`Нет выгрузок в ${base}`);
  return dirs[0];
}

const rawDir = process.env.AION2_RAW ? resolve(root, process.env.AION2_RAW) : latestRawDir();
const load = (locale) => JSON.parse(readFileSync(join(rawDir, 'text', locale, 'game.json'), 'utf8'));
const text = { ru: load('ru-RU'), en: load('en-US') };
console.log(`Тексты: ${rawDir}`);

/** Убирает разметку игры: <tag>…</>, подстановки {…} заменяет на «X». */
function clean(s) {
  return s
    .replace(/<\/?[a-z_]*>/gi, '')
    .replace(/\{[^}]+\}/g, 'X')
    .replace(/\s+/g, ' ')
    .trim();
}

function lookup(cls, gameId, field) {
  const key = `SkillString_STR_SKILL_PC_${cls}_${gameId}_${field}`;
  const ru = text.ru[key];
  const en = text.en[key];
  return ru === undefined && en === undefined ? null : { ru: ru ? clean(ru) : null, en: en ? clean(en) : null };
}

const classesDir = join(root, 'src', 'data', 'classes');
let changes = 0;

for (const file of readdirSync(classesDir).filter((f) => f.endsWith('.json'))) {
  const path = join(classesDir, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const cls = data.gameClass;
  if (!cls) {
    console.log(`${file}: нет gameClass — пропуск`);
    continue;
  }

  const className = {
    ru: text.ru[`String_STR_CLASS_${cls}_body`],
    en: text.en[`String_STR_CLASS_${cls}_body`],
  };
  for (const locale of ['ru', 'en']) {
    if (className[locale] && data.name[locale] !== className[locale]) {
      console.log(`${file}: класс ${locale}: «${data.name[locale]}» → «${className[locale]}»`);
      data.name[locale] = className[locale];
      changes++;
    }
  }

  for (const skill of data.skills) {
    if (!skill.gameId) {
      console.log(`${file}: ${skill.id}: нет gameId`);
      continue;
    }
    const name = lookup(cls, skill.gameId, 'skill_name');
    if (!name) {
      console.log(`${file}: ${skill.id}: в игре нет навыка ${skill.gameId}`);
      continue;
    }
    for (const locale of ['ru', 'en']) {
      if (name[locale] && skill.name[locale] !== name[locale]) {
        console.log(`${file}: ${skill.id}: имя ${locale}: «${skill.name[locale]}» → «${name[locale]}»`);
        skill.name[locale] = name[locale];
        changes++;
      }
    }

    (skill.specs ?? []).forEach((spec, i) => {
      const official = lookup(cls, skill.gameId + 10 * (i + 1), 'specialized_skill_desc');
      if (!official) {
        console.log(`${file}: ${skill.id}: нет текста особенности #${i + 1}`);
        return;
      }
      for (const locale of ['ru', 'en']) {
        // Цифры в шаблоне подставляются из таблиц (X) — такие тексты не затирают
        // уже известные значения со скриншотов, только показываются для сверки.
        if (official[locale]?.includes('X')) {
          if (args.has('--desc')) console.log(`  [${skill.id}] особенность #${i + 1} ${locale} (шаблон): ${official[locale]}`);
          continue;
        }
        if (official[locale] && spec.text[locale] !== official[locale]) {
          console.log(`${file}: ${skill.id}: особенность #${i + 1} ${locale}: «${spec.text[locale]}» → «${official[locale]}»`);
          spec.text[locale] = official[locale];
          changes++;
        }
      }
    });

    if (args.has('--desc')) {
      const desc = lookup(cls, skill.gameId, 'skill_desc_effect');
      if (desc) console.log(`  [${skill.id}] RU: ${desc.ru}\n  [${skill.id}] EN: ${desc.en}`);
    }
  }

  if (args.has('--write') && changes > 0) {
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
    console.log(`${file}: записано`);
  }
}

console.log(changes === 0 ? 'Расхождений нет.' : `Расхождений: ${changes}${args.has('--write') ? ' (записаны)' : ' (запустите с --write)'}`);
