#!/usr/bin/env node
/**
 * Извлекает факты из таблиц клиента в данные сайта.
 *
 *   node scripts/extract-tables.mjs          — показать, что изменится
 *   node scripts/extract-tables.mjs --write  — записать
 *
 * Выгрузка — самая свежая папка raw/client/* или AION2_RAW=raw/client/<сборка>.
 *
 * Exp.bin → src/data/game/levels.json:
 *   опыт до следующего уровня, накопленные очки умений, обломки стигмы (обычные и высшего
 *   сорта), число слотов стигм, очки Даэваниона.
 * SkillAcquireData.bin → поля levelReq / levelCost у умений в src/data/classes/*.json:
 *   с какого уровня персонажа доступен каждый уровень умения и сколько он стоит
 *   (очки умений для умений, обломки стигмы для стигм).
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { TableReader } from './lib/aion2-table.mjs';

const root = resolve(import.meta.dirname, '..');
const write = process.argv.includes('--write');

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
const table = (topic, name) => new TableReader(join(rawDir, 'tables', topic, `${name}.bin`));
const summary = JSON.parse(readFileSync(join(rawDir, 'metadata', 'summary.json'), 'utf8'));
const clientVersion = summary.clientVersion?.AppVersion ?? 'unknown';
console.log(`Таблицы: ${rawDir} (клиент ${clientVersion})`);

function save(path, data) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  let old = null;
  try {
    old = readFileSync(path, 'utf8');
  } catch {}
  if (old === text) return console.log(`${path}: без изменений`);
  if (!write) return console.log(`${path}: будет обновлён (запустите с --write)`);
  mkdirSync(resolve(path, '..'), { recursive: true });
  writeFileSync(path, text, 'utf8');
  console.log(`${path}: записан`);
}

// ---------- Exp: строка = уровень ----------
function readExp() {
  const t = table('classes-progression', 'Exp');
  const count = t.i32();
  const rows = [];
  for (let r = 0; r < count; r++) {
    const level = t.i32();
    const expToNext = t.i64();
    t.i32(); // назначение не выяснено (растёт 1 → 3834 к 45 уровню)
    t.skip(16); // всегда 0, 1, 0, 0
    const skillPoints = t.i32();
    const stigmaShards = t.i32();
    const superiorStigmaShards = t.i32();
    const stigmaSlots = t.i32();
    t.i32(); // всегда 0
    const rewards = t.i32();
    let daevanionPoints = 0;
    for (let i = 0; i < rewards; i++) {
      const type = t.enumValue();
      const amount = t.i16();
      if (type === 'DaevanionCrystal') daevanionPoints += amount;
    }
    rows.push({ level, expToNext, skillPoints, stigmaShards, superiorStigmaShards, stigmaSlots, daevanionPoints });
  }
  if (!t.done) throw new Error('Exp: разобрана не вся таблица — формат изменился');
  return rows;
}

// ---------- SkillAcquireData: строка = уровень умения ----------
function readSkillAcquire() {
  const t = table('skills', 'SkillAcquireData');
  const count = t.i32();
  /** gameId → массив уровней */
  const bySkill = new Map();
  for (let r = 0; r < count; r++) {
    t.i32(); // id строки
    const cls = t.enumValue();
    const type = t.enumValue();
    const skill = t.i32();
    const level = t.i32();
    const autoLearned = t.u8() === 1;
    const charLevel = t.i32();
    const ascension = t.enumValue();
    const prevCount = t.i32();
    t.structTag();
    if (prevCount > 0) throw new Error(`SkillAcquireData: у ${skill} есть NeedPrevSkillData — формат элемента не разобран`);
    const skillPoints = t.u16();
    const stigmaShards = t.u16();
    t.i32(); // всегда 0
    const costItems = t.i32();
    t.structTag();
    if (costItems > 0) throw new Error(`SkillAcquireData: у ${skill} есть CostItemData — формат элемента не разобран`);
    t.u8();
    if (!bySkill.has(skill)) bySkill.set(skill, []);
    bySkill.get(skill)[level - 1] = { cls, type, charLevel, autoLearned, ascension, skillPoints, stigmaShards };
  }
  if (!t.done) throw new Error('SkillAcquireData: разобрана не вся таблица — формат изменился');
  return bySkill;
}

const levels = readExp();
save(join(root, 'src', 'data', 'game', 'levels.json'), {
  clientVersion,
  levels: levels.filter((l) => l.level <= 60),
});

const acquire = readSkillAcquire();
const classesDir = join(root, 'src', 'data', 'classes');
for (const file of readdirSync(classesDir).filter((f) => f.endsWith('.json'))) {
  const path = join(classesDir, file);
  const data = JSON.parse(readFileSync(path, 'utf8'));
  for (const skill of data.skills) {
    const rows = skill.gameId && acquire.get(skill.gameId);
    if (!rows) {
      console.log(`${file}: ${skill.id}: нет строк в SkillAcquireData`);
      continue;
    }
    const stigma = skill.type === 'stigma';
    skill.unlockLevel = rows[0].charLevel;
    skill.levelReq = rows.map((r) => r.charLevel);
    // levelCost[i] — цена перехода на уровень i+1 (для 1 уровня — изучение)
    skill.levelCost = rows.map((r) => (stigma ? r.stigmaShards : r.skillPoints));
    if (stigma && rows[0].ascension !== 'None') skill.learnAscension = rows[0].ascension;
  }
  save(path, data);
}
