// Банк мотивационных фраз. Подбор зависит от текущей серии и ближайшей цели.

import { nextAchievement } from './achievements'

const START: string[] = [
  'Каждый день без энергетика — подарок твоему сердцу.',
  'Сегодня отличный день, чтобы начать заново. Ты справишься.',
  'Маленький шаг сегодня — большая разница завтра.',
]

const EARLY: string[] = [
  'Ты уже в пути. Гордись каждым днём.',
  'Тяга проходит, а сила воли остаётся.',
  'Тело потихоньку восстанавливается. Продолжай!',
]

const STRONG: string[] = [
  'Ты делаешь это ради себя — и это видно.',
  'Серия растёт, и ты вместе с ней становишься сильнее.',
  'Каждый отмеченный день — это маленькая победа.',
]

const BLAZING: string[] = [
  'Это уже не борьба, это твой новый стиль жизни.',
  'Ты вдохновляешь. Серьёзно.',
  'Огонь твоей серии не остановить. 🔥',
]

function pick(list: string[], seed: number): string {
  return list[seed % list.length]
}

/**
 * Мотивационное сообщение под текущую серию.
 * @param streak текущая серия
 * @param seed индекс для ротации (например, день месяца), чтобы фраза менялась
 */
export function motivationFor(streak: number, seed = 0): string {
  const next = nextAchievement(streak)
  // если до ачивки осталось 1–2 дня — показываем цель
  if (next && next.days - streak <= 2 && streak > 0) {
    const left = next.days - streak
    const word = left === 1 ? 'день' : 'дня'
    return `До цели «${next.title}» остался${left === 1 ? '' : 'ось'} ${left} ${word} 💜`
  }

  let bank: string[]
  if (streak <= 0) bank = START
  else if (streak < 7) bank = EARLY
  else if (streak < 30) bank = STRONG
  else bank = BLAZING

  return pick(bank, seed)
}
