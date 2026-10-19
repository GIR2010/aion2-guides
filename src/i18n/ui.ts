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
    'class.skills': 'Навыки',
    'class.active': 'Активные',
    'class.passive': 'Пассивные',
    'class.stigma': 'Стигмы',
    'class.guides': 'Гайды',
    'skill.level': 'Ур.',
    'skill.name': 'Навык',
    'skill.cooldown': 'Перезарядка',
    'skill.effect': 'Эффект',
    'skill.status': 'Данные',
    'skill.ruPending': 'RU-название уточняется',
    'status.verified': 'Проверено в игре',
    'status.multi-source': '2+ источника',
    'status.single-source': '1 источник',
    'status.unknown': 'Нет данных',
    'timeline.level': 'Уровень',
    'timeline.pick': 'Выберите уровень персонажа',
    'timeline.newSkills': 'Новые навыки',
    'timeline.unlocks': 'Открывается',
    'timeline.todo': 'Что делать',
    'timeline.zone': 'Где качаться',
    'timeline.nothing': 'На этом уровне ничего нового — продолжайте сюжет.',
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
    'skill.ruPending': '',
    'status.verified': 'Verified in game',
    'status.multi-source': '2+ sources',
    'status.single-source': 'Single source',
    'status.unknown': 'No data',
    'timeline.level': 'Level',
    'timeline.pick': 'Pick your character level',
    'timeline.newSkills': 'New skills',
    'timeline.unlocks': 'Unlocks',
    'timeline.todo': 'What to do',
    'timeline.zone': 'Where to level',
    'timeline.nothing': 'Nothing new at this level — keep following the story.',
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
