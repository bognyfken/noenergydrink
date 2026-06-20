// Чистые функции расчёта серии и статистики. Покрыты тестами (streak.test.ts).
//
// Правила:
//  - Текущая серия = подряд идущие 'clean' дни, заканчивающиеся сегодня
//    (или вчера, если сегодня ещё НЕ отмечено — чтобы серия не «сбрасывалась»
//    в полночь до того, как пользователь отметит день).
//  - Срыв ('drank') рвёт серию.
//  - Пропущенный ('unmarked') день в середине рвёт серию.
//  - Сегодняшний неотмеченный день серию НЕ рвёт.

import type { DayEntry, DayStatus } from './types'
import { addDays, dateKey } from './date'

export type EntryMap = Map<string, DayEntry>

/** Построить Map по ключу даты из списка записей. */
export function toEntryMap(entries: DayEntry[]): EntryMap {
  return new Map(entries.map((e) => [e.date, e]))
}

function statusOn(map: EntryMap, d: Date): DayStatus {
  return map.get(dateKey(d))?.status ?? 'unmarked'
}

/** Текущая серия чистых дней. */
export function computeCurrentStreak(map: EntryMap, today: Date = new Date()): number {
  let cursor = new Date(today)
  // сегодня ещё не отмечено — это ок, начинаем считать со вчера
  if (statusOn(map, cursor) === 'unmarked') {
    cursor = addDays(cursor, -1)
  }
  let streak = 0
  while (statusOn(map, cursor) === 'clean') {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Лучшая (рекордная) серия за всё время. */
export function computeBestStreak(map: EntryMap): number {
  const cleanKeys = [...map.values()]
    .filter((e) => e.status === 'clean')
    .map((e) => e.date)
    .sort()

  let best = 0
  let run = 0
  let prev: string | null = null

  for (const key of cleanKeys) {
    if (prev !== null && key === dateKey(addDays(parseLocal(prev), 1))) {
      run++
    } else {
      run = 1
    }
    if (run > best) best = run
    prev = key
  }
  return best
}

/** Всего чистых дней за всё время. */
export function computeTotalCleanDays(map: EntryMap): number {
  let n = 0
  for (const e of map.values()) if (e.status === 'clean') n++
  return n
}

// локальный парсер ключа без импорта date-fns (чтобы функции оставались чистыми/быстрыми)
function parseLocal(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}
