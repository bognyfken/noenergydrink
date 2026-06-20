import { describe, expect, it } from 'vitest'
import { computeAchStats, unlockedIds } from './achievements'
import type { DayEntry, DayStatus } from './types'

// Опорные факты по календарю 2026 (локальная зона):
//  - 2026-06-01 — понедельник, значит 06-06 сб, 06-07 вс
//  - 2026-02 — 28 дней (не високосный)
//  - 2026-01-01 — четверг

function e(date: string, status: DayStatus, note?: string): DayEntry {
  return { date, status, note, updatedAt: 0 }
}

// все дни месяца YYYY-MM как чистые
function fullMonth(ym: string, days: number): DayEntry[] {
  return Array.from({ length: days }, (_, i) =>
    e(`${ym}-${String(i + 1).padStart(2, '0')}`, 'clean'),
  )
}

describe('computeAchStats', () => {
  it('пустой журнал → всё по нулям', () => {
    const s = computeAchStats([])
    expect(s.best).toBe(0)
    expect(s.totalClean).toBe(0)
    expect(s.comebacks).toBe(0)
    expect(s.fullCalendarMonth).toBe(false)
    expect(s.cleanNewYear).toBe(false)
  })

  it('полная календарная неделя пн–вс: неделя, выходные, понедельник', () => {
    const week = ['01', '02', '03', '04', '05', '06', '07'].map((d) =>
      e(`2026-06-${d}`, 'clean'),
    )
    const s = computeAchStats(week)
    expect(s.best).toBe(7)
    expect(s.fullCalendarWeeks).toBe(1)
    expect(s.cleanWeekends).toBe(1) // сб 06-06 + вс 06-07
    expect(s.cleanMondays).toBe(1) // пн 06-01
    expect(s.bestMonthClean).toBe(7)
    expect(s.distinctCleanMonths).toBe(1)
  })

  it('возвращения и серия учёта считаются по хронологии', () => {
    const s = computeAchStats([
      e('2026-06-01', 'clean'),
      e('2026-06-02', 'drank'),
      e('2026-06-03', 'clean'),
      e('2026-06-04', 'clean'),
      e('2026-06-05', 'drank'),
      e('2026-06-06', 'clean'),
    ])
    expect(s.comebacks).toBe(2) // 06-03 после срыва и 06-06 после срыва
    expect(s.loggingStreak).toBe(6) // 6 подряд отмеченных дней
    expect(s.totalClean).toBe(4)
    expect(s.totalDrank).toBe(2)
    expect(s.totalMarked).toBe(6)
    expect(s.best).toBe(2) // макс серия чистых подряд: 06-03..06-04
  })

  it('пропуск дня рвёт серию учёта', () => {
    const s = computeAchStats([
      e('2026-06-01', 'clean'),
      e('2026-06-02', 'clean'),
      // 06-03 пропущен
      e('2026-06-04', 'clean'),
    ])
    expect(s.loggingStreak).toBe(2)
  })

  it('полный календарный месяц и лучший месяц', () => {
    const s = computeAchStats(fullMonth('2026-02', 28))
    expect(s.fullCalendarMonth).toBe(true)
    expect(s.bestMonthClean).toBe(28)
  })

  it('неполный месяц не засчитывается как идеальный', () => {
    const s = computeAchStats(fullMonth('2026-02', 27)) // не хватает одного дня
    expect(s.fullCalendarMonth).toBe(false)
    expect(s.bestMonthClean).toBe(27)
  })

  it('заметки и новый год', () => {
    const s = computeAchStats([
      e('2026-01-01', 'clean', 'с нового года — заново'),
      e('2026-01-02', 'clean', '   '), // пробелы не считаются заметкой
      e('2026-01-03', 'clean', 'тяжело, но держусь'),
    ])
    expect(s.notes).toBe(2)
    expect(s.cleanNewYear).toBe(true)
  })

  it('срыв 1 января не даёт ачивку нового года', () => {
    const s = computeAchStats([e('2026-01-01', 'drank')])
    expect(s.cleanNewYear).toBe(false)
  })
})

describe('секретные сигналы', () => {
  it('високосный день и пятница 13-го', () => {
    // 2024-02-29 — четверг (високосный год); 2026-02-13 — пятница
    const s = computeAchStats([
      e('2024-02-29', 'clean'),
      e('2026-02-13', 'clean'),
    ])
    expect(s.leapDayClean).toBe(true)
    expect(s.friday13Clean).toBe(true)
  })

  it('обычная пятница не 13-го не считается', () => {
    const s = computeAchStats([e('2026-02-20', 'clean')]) // пятница, но 20-е
    expect(s.friday13Clean).toBe(false)
  })

  it('второе дыхание: серия 14+ только после срыва', () => {
    const days: DayEntry[] = [
      e('2026-03-01', 'drank'),
      ...Array.from({ length: 14 }, (_, i) =>
        e(`2026-03-${String(i + 2).padStart(2, '0')}`, 'clean'),
      ),
    ]
    const s = computeAchStats(days)
    expect(s.postLapseStreak).toBe(14)
    expect(s.comebacks).toBe(1)
  })

  it('серия до срыва не засчитывается во второе дыхание', () => {
    const s = computeAchStats([
      ...Array.from({ length: 14 }, (_, i) =>
        e(`2026-03-${String(i + 1).padStart(2, '0')}`, 'clean'),
      ),
      e('2026-03-15', 'drank'),
    ])
    expect(s.postLapseStreak).toBe(0) // чистая серия была ДО срыва
  })

  it('феникс: чистый день после 3+ срывов подряд', () => {
    const s = computeAchStats([
      e('2026-03-01', 'drank'),
      e('2026-03-02', 'drank'),
      e('2026-03-03', 'drank'),
      e('2026-03-04', 'clean'),
    ])
    expect(s.phoenix).toBe(true)
  })

  it('феникс не срабатывает после 1–2 срывов подряд', () => {
    const s = computeAchStats([
      e('2026-03-01', 'drank'),
      e('2026-03-02', 'drank'),
      e('2026-03-03', 'clean'),
    ])
    expect(s.phoenix).toBe(false)
  })

  it('феникс требует именно подряд идущих срывов', () => {
    const s = computeAchStats([
      e('2026-03-01', 'drank'),
      e('2026-03-02', 'clean'),
      e('2026-03-03', 'drank'),
      e('2026-03-04', 'clean'),
      e('2026-03-05', 'drank'),
      e('2026-03-06', 'clean'),
    ])
    expect(s.phoenix).toBe(false) // три срыва, но не подряд
  })

  it('ночная отметка по времени правки', () => {
    const night = new Date(2026, 5, 20, 2, 30).getTime() // 02:30 локально
    const day = new Date(2026, 5, 21, 14, 0).getTime() // 14:00 локально
    expect(computeAchStats([{ date: '2026-06-20', status: 'clean', updatedAt: night }]).markedAtNight).toBe(true)
    expect(computeAchStats([{ date: '2026-06-21', status: 'clean', updatedAt: day }]).markedAtNight).toBe(false)
  })

  it('updatedAt = 0 не считается ночной отметкой', () => {
    expect(computeAchStats([e('2026-06-20', 'clean')]).markedAtNight).toBe(false)
  })
})

describe('unlockedIds', () => {
  it('открывает ачивки по разным сигналам, а не только по серии', () => {
    const ids = unlockedIds(
      computeAchStats([
        ...['01', '02', '03', '04', '05', '06', '07'].map((d) =>
          e(`2026-06-${d}`, 'clean', 'заметка'),
        ),
      ]),
    )
    expect(ids).toContain('d7') // серия 7
    expect(ids).toContain('total7') // всего 7 чистых
    expect(ids).toContain('week_cal') // идеальная неделя
    expect(ids).toContain('weekend1') // чистые выходные
    expect(ids).toContain('log7') // 7 дней учёта подряд
    expect(ids).toContain('note1') // есть заметки
    expect(ids).not.toContain('note10') // но их всего 7, не 10
    expect(ids).not.toContain('d30') // серия всего 7 — месяц не открыт
  })
})
