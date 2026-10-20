import { existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Иконки умений лежат в public/icons/skills/<класс>/<id умения>.webp.
 * Исходники — PNG из клиента (raw/.../round-03/assets/icons/png), сопоставленные по Skill.SkillIcon
 * и texture-export-map.csv; в public — уменьшенные копии 96×96.
 */
export function skillIconUrl(classId: string, skillId: string): string | null {
  const rel = `icons/skills/${classId}/${skillId}.webp`;
  if (!existsSync(join(process.cwd(), 'public', rel))) return null;
  return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${rel}`;
}
