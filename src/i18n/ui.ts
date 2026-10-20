export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

/** Текст на двух языках. `ru: null` — официальный перевод ещё не подтверждён. */
export type LocalizedText = { ru: string | null; en: string | null };

const ui = {
  ru: {
    'site.title': 'Aion 2 — гайд',
    'site.description': 'Гайды по прокачке, классам, стигмам и экипировке Aion 2',
    'nav.home': 'Главная',
    'nav.classes': 'Классы',
    'nav.leveling': 'Прокачка',
    'nav.lang': 'English',
    'class.skills': 'Умения',
    'class.active': 'Активные',
    'class.passive': 'Пассивные',
    'class.stigma': 'Стигмы',
    'class.guides': 'Гайды',
    'skill.level': 'Ур.',
    'skill.name': 'Умение',
    'skill.cooldown': 'Перезарядка',
    'skill.effect': 'Эффект',
    'skill.status': 'Данные',
    'skill.mp': 'ОМ',
    'skill.specs': 'Особенности',
    'skill.ruPending': 'RU-название уточняется',
    'status.verified': 'Проверено в игре',
    'status.multi-source': '2+ источника',
    'status.single-source': '1 источник',
    'status.unknown': 'Нет данных',
    'timeline.level': 'Уровень',
    'timeline.pick': 'Выберите уровень персонажа',
    'timeline.newSkills': 'Новые умения',
    'timeline.skillUps': 'Можно поднять умения',
    'timeline.skillUpsHint': 'Новый предел уровня умения за очки умений. Вкладывайте сверху вниз, пока хватает очков.',
    'timeline.points': 'очк.',
    'timeline.specs': 'Выбор особенности (ур. умения 8)',
    'timeline.pointsEarned': 'Очков умений за уровни',
    'timeline.pointsNeeded': 'нужно на все умения из приоритета',
    'timeline.pointsHint': 'Разницу закрывают камни мудрости из запечатанных подземелий и заданий. Если очков не хватает — вкладывайте строго по приоритету.',
    'timeline.unlocks': 'Открывается',
    'timeline.todo': 'Что делать',
    'timeline.zone': 'Где качаться',
    'timeline.exp': 'опыта до следующего уровня',
    'timeline.nothing': 'На этом уровне ничего нового — продолжайте сюжет.',
    'timeline.changes': 'Изменить в раскладке',
    'timeline.chMacroNew': '{macro}: создайте снизу вверх — {list}',
    'timeline.chMacroAdd': '{macro}: добавьте «{skill}» в ячейку {slot} (снизу)',
    'timeline.chStigma': 'Слот стигмы {slot}: поставьте «{skill}»',
    'timeline.build': 'Сборка к этому уровню',
    'timeline.buildHint': 'Что должно стоять, если вы пропустили несколько уровней: выставьте всё сразу. Очки вложены строго по приоритету.',
    'timeline.budgetLevels': 'Только очки за уровни',
    'timeline.budgetStones': '+ камни мудрости из запечатанных подземелий',
    'timeline.pointsLeft': 'в запасе',
    'timeline.cap': 'предел',
    'timeline.others': 'Остальные умения — ур. 1',
    'timeline.stigmas': 'Стигмы',
    'timeline.stigmaSlot': 'Слот',
    'timeline.notLearned': 'изучить, когда будет обломок',
    'timeline.shards': 'обломков',
    'timeline.macros': 'Связки (снизу вверх)',
    'timeline.daevanion': 'Доски Даэваниона',
    'sources.title': 'Источники',
    'footer.disclaimer':
      'Фан-проект, не связан с NCSOFT. Aion — торговая марка NCSOFT Corporation.',
    'draft.note': 'Черновик: часть данных ещё не проверена в игре.',
  },
  en: {
    'site.title': 'Aion 2 Guide',
    'site.description': 'Aion 2 leveling, class, stigma and gear guides',
    'nav.home': 'Home',
    'nav.classes': 'Classes',
    'nav.leveling': 'Leveling',
    'nav.lang': 'Русский',
    'class.skills': 'Skills',
    'class.active': 'Active',
    'class.passive': 'Passive',
    'class.stigma': 'Stigma',
    'class.guides': 'Guides',
    'skill.level': 'Lv.',
    'skill.name': 'Skill',
    'skill.cooldown': 'Cooldown',
    'skill.effect': 'Effect',
    'skill.status': 'Data',
    'skill.mp': 'MP',
    'skill.specs': 'Specializations',
    'skill.ruPending': '',
    'status.verified': 'Verified in game',
    'status.multi-source': '2+ sources',
    'status.single-source': 'Single source',
    'status.unknown': 'No data',
    'timeline.level': 'Level',
    'timeline.pick': 'Pick your character level',
    'timeline.newSkills': 'New skills',
    'timeline.skillUps': 'Skills you can raise',
    'timeline.skillUpsHint': 'New skill level cap for Skill Points. Spend top to bottom while you have points.',
    'timeline.points': 'pts',
    'timeline.specs': 'Specialization pick (skill level 8)',
    'timeline.pointsEarned': 'Skill Points from levels',
    'timeline.pointsNeeded': 'needed for every priority skill',
    'timeline.pointsHint': 'Wisdom Stones from Sealed Dungeons and quests cover the gap. If you are short, spend strictly by priority.',
    'timeline.unlocks': 'Unlocks',
    'timeline.todo': 'What to do',
    'timeline.zone': 'Where to level',
    'timeline.exp': 'XP to next level',
    'timeline.nothing': 'Nothing new at this level — keep following the story.',
    'timeline.changes': 'Change in your layout',
    'timeline.chMacroNew': '{macro}: create it, bottom to top — {list}',
    'timeline.chMacroAdd': '{macro}: add “{skill}” to slot {slot} (from the bottom)',
    'timeline.chStigma': 'Stigma slot {slot}: equip “{skill}”',
    'timeline.build': 'Build at this level',
    'timeline.buildHint': 'What you should have if you skipped a few levels: set it all at once. Points are spent strictly by priority.',
    'timeline.budgetLevels': 'Level points only',
    'timeline.budgetStones': '+ Wisdom Stones from Sealed Dungeons',
    'timeline.pointsLeft': 'saved',
    'timeline.cap': 'cap',
    'timeline.others': 'Other skills — level 1',
    'timeline.stigmas': 'Stigma',
    'timeline.stigmaSlot': 'Slot',
    'timeline.notLearned': 'learn once you have a Shard',
    'timeline.shards': 'Shards',
    'timeline.macros': 'Macros (bottom to top)',
    'timeline.daevanion': 'Daevanion boards',
    'sources.title': 'Sources',
    'footer.disclaimer':
      'Fan project, not affiliated with NCSOFT. Aion is a trademark of NCSOFT Corporation.',
    'draft.note': 'Draft: some data is not yet verified in game.',
  },
} as const;

export type UiKey = keyof (typeof ui)['ru'];

export function t(locale: Locale, key: UiKey): string {
  return ui[locale][key] ?? ui[defaultLocale][key];
}

/** Берёт текст на нужном языке, при отсутствии — на другом. */
export function pick(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return '';
  return text[locale] ?? text.en ?? text.ru ?? '';
}

export function isLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

/** Ссылка с учётом base (GitHub Pages публикует сайт в подпапке репозитория). */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean.endsWith('/') ? clean : `${clean}/`}`;
}

export function localeUrl(locale: Locale, path = ''): string {
  return url(`/${locale}/${path.replace(/^\//, '')}`);
}
