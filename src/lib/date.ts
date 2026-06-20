// Работа с датами. Везде используем строковый ключ 'YYYY-MM-DD' в ЛОКАЛЬНОЙ зоне,
// чтобы «сегодня» совпадало с тем, что видит пользователь на телефоне.

import { format, parse } from 'date-fns'
import { ru } from 'date-fns/locale'

/** Ключ дня в локальной зоне: 'YYYY-MM-DD'. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Разобрать ключ 'YYYY-MM-DD' обратно в Date (локальная полночь). */
export function parseKey(key: string): Date {
  return parse(key, 'yyyy-MM-dd', new Date())
}

/** Прибавить дни к дате (может быть отрицательным). */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

/** Ключ дня со сдвигом относительно сегодня. */
export function dayKeyOffset(offset: number, from: Date = new Date()): string {
  return dateKey(addDays(from, offset))
}

/** Сегодняшний ключ. */
export function todayKey(): string {
  return dateKey(new Date())
}

/** Человеческое название месяца и год, напр. «июнь 2026». */
export function monthTitle(d: Date): string {
  return format(d, 'LLLL yyyy', { locale: ru })
}

/** Короткая дата, напр. «20 июня». */
export function humanDay(key: string): string {
  return format(parseKey(key), 'd MMMM', { locale: ru })
}

/** Сокращённые названия дней недели, понедельник первым. */
export const WEEKDAYS_SHORT = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс']
