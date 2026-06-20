import { describe, expect, it } from 'vitest'
import {
  computeBestStreak,
  computeCurrentStreak,
  computeTotalCleanDays,
  toEntryMap,
} from './streak'
import type { DayEntry, DayStatus } from './types'
import { dateKey, addDays } from './date'

// фиксированная «сегодня» для детерминированных тестов
const TODAY = new Date(2026, 5, 20) // 2026-06-20 (локальная зона)

function entry(offset: number, status: DayStatus): DayEntry {
  return {
    date: dateKey(addDays(TODAY, offset)),
    status,
    updatedAt: 0,
  }
}

function mapOf(...entries: DayEntry[]) {
  return toEntryMap(entries)
}

describe('computeCurrentStreak', () => {
  it('пустой журнал → серия 0', () => {
    expect(computeCurrentStreak(mapOf(), TODAY)).toBe(0)
  })

  it('сегодня отмечен clean → серия включает сегодня', () => {
    const m = mapOf(entry(0, 'clean'), entry(-1, 'clean'), entry(-2, 'clean'))
    expect(computeCurrentStreak(m, TODAY)).toBe(3)
  })

  it('сегодня НЕ отмечен, но вчера и позавчера clean → серия 2 (не сбрасывается)', () => {
    const m = mapOf(entry(-1, 'clean'), entry(-2, 'clean'))
    expect(computeCurrentStreak(m, TODAY)).toBe(2)
  })

  it('срыв сегодня → серия 0', () => {
    const m = mapOf(entry(0, 'drank'), entry(-1, 'clean'), entry(-2, 'clean'))
    expect(computeCurrentStreak(m, TODAY)).toBe(0)
  })

  it('пропущенный день в середине рвёт серию', () => {
    // сегодня clean, вчера пропущено, позавчера clean
    const m = mapOf(entry(0, 'clean'), entry(-2, 'clean'))
    expect(computeCurrentStreak(m, TODAY)).toBe(1)
  })
})

describe('computeBestStreak', () => {
  it('находит самый длинный непрерывный отрезок clean', () => {
    const m = mapOf(
      entry(-10, 'clean'),
      entry(-9, 'clean'),
      entry(-8, 'drank'),
      entry(-7, 'clean'),
      entry(-6, 'clean'),
      entry(-5, 'clean'),
      entry(-4, 'clean'),
    )
    expect(computeBestStreak(m)).toBe(4)
  })

  it('пустой журнал → 0', () => {
    expect(computeBestStreak(mapOf())).toBe(0)
  })
})

describe('computeTotalCleanDays', () => {
  it('считает все clean дни независимо от непрерывности', () => {
    const m = mapOf(
      entry(0, 'clean'),
      entry(-1, 'drank'),
      entry(-2, 'clean'),
      entry(-3, 'clean'),
    )
    expect(computeTotalCleanDays(m)).toBe(3)
  })
})
