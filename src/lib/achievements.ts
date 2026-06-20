// Ачивки: разнообразные награды на основе журнала дней.
// Опираются не только на длину серии, а на множество сигналов
// (см. AchStats / computeAchStats). Тёплые формулировки, без давления.
// Картинки — public/achievements/<id>.webp; у кого нет арта — рисуем иконку по категории.

import type { DayEntry, DayStatus } from './types'
import { addDays, dateKey, parseKey } from './date'
import { computeBestStreak, toEntryMap } from './streak'

export type AchievementCategory =
  | 'streak' // длина серии подряд
  | 'total' // всего чистых дней
  | 'comeback' // возвращение после срыва
  | 'calendar' // календарные узоры (выходные, недели, месяцы)
  | 'logging' // дисциплина учёта (отмечать дни)
  | 'notes' // заметки в дневнике

export interface AchievementDef {
  id: string
  title: string
  description: string // когда открыта — тёплая похвала
  hint: string // когда закрыта — что нужно сделать
  category: AchievementCategory
  /** цель в днях для серий — нужна для прогресса «осталось N дней». */
  goal?: number
  hasImage: boolean
  /** секретная: скрыта до открытия (показывается как «???»). */
  secret?: boolean
  /** предикат: открыта ли ачивка при данной статистике. */
  test: (s: AchStats) => boolean
}

/** Все сигналы, по которым решаем, какие ачивки открыты. */
export interface AchStats {
  best: number // рекорд серии подряд
  totalClean: number // всего чистых дней (не подряд)
  totalDrank: number // всего срывов
  totalMarked: number // всего отмеченных дней (clean+drank)
  notes: number // дней с непустой заметкой
  comebacks: number // сколько раз вернулась к чистому дню сразу после срыва
  loggingStreak: number // макс. серия подряд отмеченных дней (любой статус)
  cleanWeekends: number // полностью чистые выходные (сб+вс)
  fullCalendarWeeks: number // идеальные календарные недели пн–вс (все 7 чистые)
  cleanMondays: number // чистые понедельники
  bestMonthClean: number // макс. чистых дней в одном календарном месяце
  fullCalendarMonth: boolean // был ли хоть один полностью чистый календарный месяц
  distinctCleanMonths: number // в скольких разных месяцах есть чистые дни
  cleanNewYear: boolean // встретила 1 января чистой
  // ── сигналы для секретных ачивок ──
  leapDayClean: boolean // чистое 29 февраля
  friday13Clean: boolean // чистая пятница 13-го
  markedAtNight: boolean // отметила день глубокой ночью (00:00–04:59)
  postLapseStreak: number // макс. серия чистых дней, начавшаяся после срыва
  phoenix: boolean // вернулась к чистому дню после 3+ срывов подряд
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── серия подряд ──────────────────────────────────────────────
  { id: 'd1', category: 'streak', goal: 1, hasImage: true, title: 'Первый день', hint: '1 день подряд', description: 'Ты начала. Самый трудный шаг уже позади 💜', test: (s) => s.best >= 1 },
  { id: 'd3', category: 'streak', goal: 3, hasImage: true, title: 'Три дня', hint: '3 дня подряд', description: 'Тело уже благодарит тебя. Чувствуешь?', test: (s) => s.best >= 3 },
  { id: 'd7', category: 'streak', goal: 7, hasImage: true, title: 'Неделя', hint: '7 дней подряд', description: 'Целая неделя без банки. Это настоящая сила.', test: (s) => s.best >= 7 },
  { id: 'd14', category: 'streak', goal: 14, hasImage: true, title: 'Две недели', hint: '14 дней подряд', description: 'Привычка уже меняется. Ты большая молодец.', test: (s) => s.best >= 14 },
  { id: 'd21', category: 'streak', goal: 21, hasImage: true, title: 'Три недели', hint: '21 день подряд', description: 'Говорят, столько нужно новой привычке. Получилось.', test: (s) => s.best >= 21 },
  { id: 'd30', category: 'streak', goal: 30, hasImage: true, title: 'Месяц', hint: '30 дней подряд', description: 'Целый месяц! Я очень тобой горжусь.', test: (s) => s.best >= 30 },
  { id: 'd60', category: 'streak', goal: 60, hasImage: true, title: 'Два месяца', hint: '60 дней подряд', description: 'Это уже образ жизни, а не борьба.', test: (s) => s.best >= 60 },
  { id: 'd90', category: 'streak', goal: 90, hasImage: true, title: 'Три месяца', hint: '90 дней подряд', description: 'Три месяца. Ты будто другой человек — лёгкий и свободный.', test: (s) => s.best >= 90 },
  { id: 'd100', category: 'streak', goal: 100, hasImage: true, title: '100 дней', hint: '100 дней подряд', description: 'Сотня дней. Ты невероятная 💜', test: (s) => s.best >= 100 },
  { id: 'd180', category: 'streak', goal: 180, hasImage: true, title: 'Полгода', hint: '180 дней подряд', description: 'Полгода свободы. Ты переписала свою историю.', test: (s) => s.best >= 180 },
  { id: 'd365', category: 'streak', goal: 365, hasImage: true, title: 'Целый год', hint: '365 дней подряд', description: 'Год без энергетиков. Это победа на всю жизнь.', test: (s) => s.best >= 365 },

  // ── всего чистых дней (в сумме, не подряд) ────────────────────
  { id: 'total7', category: 'total', hasImage: true, title: 'Первая семёрка', hint: 'всего 7 чистых дней', description: 'Семь чистых дней в копилке. Путь начался.', test: (s) => s.totalClean >= 7 },
  { id: 'total30', category: 'total', hasImage: true, title: '30 чистых дней', hint: 'всего 30 чистых дней', description: '30 дней без банки в сумме. Каждый — на счету.', test: (s) => s.totalClean >= 30 },
  { id: 'total50', category: 'total', hasImage: true, title: '50 чистых дней', hint: 'всего 50 чистых дней', description: 'Полсотни чистых дней. Видно, как далеко ты зашла.', test: (s) => s.totalClean >= 50 },
  { id: 'total100', category: 'total', hasImage: true, title: '100 чистых дней', hint: 'всего 100 чистых дней', description: 'Сто чистых дней суммарно. Огромный путь.', test: (s) => s.totalClean >= 100 },
  { id: 'total200', category: 'total', hasImage: true, title: '200 чистых дней', hint: 'всего 200 чистых дней', description: 'Двести дней выбора в свою пользу.', test: (s) => s.totalClean >= 200 },
  { id: 'total365', category: 'total', hasImage: true, title: 'Год чистых дней', hint: 'всего 365 чистых дней', description: 'Год чистых дней набрался по крупицам. Невероятно.', test: (s) => s.totalClean >= 365 },

  // ── возвращение после срыва ───────────────────────────────────
  { id: 'comeback', category: 'comeback', hasImage: true, title: 'Возвращение', hint: 'вернуться к чистому дню после срыва', description: 'Сорваться — не провал. Вернуться — вот что важно.', test: (s) => s.comebacks >= 1 },
  { id: 'comeback3', category: 'comeback', hasImage: true, title: 'Несгибаемая', hint: 'вернуться после срыва трижды', description: 'Падала и вставала снова и снова. Это и есть сила воли.', test: (s) => s.comebacks >= 3 },

  // ── календарные узоры ─────────────────────────────────────────
  { id: 'weekend1', category: 'calendar', hasImage: true, title: 'Чистые выходные', hint: 'провести субботу и воскресенье чисто', description: 'Выходные без банки — там, где обычно сложнее всего.', test: (s) => s.cleanWeekends >= 1 },
  { id: 'weekend4', category: 'calendar', hasImage: true, title: 'Месяц выходных', hint: 'четыре чистых уикенда', description: 'Четыре чистых уикенда. Отдыхать можно и без энергетика.', test: (s) => s.cleanWeekends >= 4 },
  { id: 'week_cal', category: 'calendar', hasImage: true, title: 'Идеальная неделя', hint: 'неделя пн–вс без срывов', description: 'Полная неделя, с понедельника по воскресенье — без единого срыва.', test: (s) => s.fullCalendarWeeks >= 1 },
  { id: 'month_cal', category: 'calendar', hasImage: true, title: 'Идеальный месяц', hint: 'целый календарный месяц чисто', description: 'Каждый день месяца — чистый. Безупречно.', test: (s) => s.fullCalendarMonth },
  { id: 'month20', category: 'calendar', hasImage: true, title: 'Почти идеальный месяц', hint: '20 чистых дней за один месяц', description: 'Двадцать чистых дней в одном месяце. Почти без помарок.', test: (s) => s.bestMonthClean >= 20 },
  { id: 'monday4', category: 'calendar', hasImage: true, title: 'Лёгкий понедельник', hint: 'четыре чистых понедельника', description: 'Понедельники тебе больше не страшны.', test: (s) => s.cleanMondays >= 4 },
  { id: 'seasons', category: 'calendar', hasImage: true, title: 'Времена меняются', hint: 'чистые дни в трёх разных месяцах', description: 'Чистые дни в трёх разных месяцах. Это уже образ жизни.', test: (s) => s.distinctCleanMonths >= 3 },
  { id: 'newyear', category: 'calendar', hasImage: true, title: 'Новый год — новая я', hint: 'встретить 1 января чисто', description: 'Первое января — и сразу чисто. Лучшее начало года.', test: (s) => s.cleanNewYear },

  // ── дисциплина учёта ──────────────────────────────────────────
  { id: 'log7', category: 'logging', hasImage: true, title: 'Внимательная неделя', hint: 'отмечать каждый день 7 дней подряд', description: 'Семь дней подряд отмечала каждый день. Дневник ведётся.', test: (s) => s.loggingStreak >= 7 },
  { id: 'log30', category: 'logging', hasImage: true, title: 'Дисциплина', hint: 'отмечать каждый день 30 дней подряд', description: 'Месяц без единого пропуска в журнале. Ты держишь руку на пульсе.', test: (s) => s.loggingStreak >= 30 },
  { id: 'marked50', category: 'logging', hasImage: true, title: 'Полсотни отметок', hint: 'отметить 50 дней', description: 'Пятьдесят отмеченных дней. Ты честна сама с собой.', test: (s) => s.totalMarked >= 50 },

  // ── заметки в дневнике ────────────────────────────────────────
  { id: 'note1', category: 'notes', hasImage: true, title: 'Первая мысль', hint: 'оставить первую заметку', description: 'Записала первую заметку. Слова помогают разобраться в себе.', test: (s) => s.notes >= 1 },
  { id: 'note10', category: 'notes', hasImage: true, title: 'Дневник чувств', hint: 'оставить 10 заметок', description: 'Десять дней с заметками. Ты слышишь себя.', test: (s) => s.notes >= 10 },

  // ── секретные (скрыты до открытия) ────────────────────────────
  { id: 'leapday', category: 'calendar', hasImage: true, secret: true, title: 'Високосный', hint: '???', description: 'Чистая даже 29 февраля — день, который бывает раз в четыре года.', test: (s) => s.leapDayClean },
  { id: 'friday13', category: 'calendar', hasImage: true, secret: true, title: 'Пятница, 13', hint: '???', description: 'Пятница 13-го — и никакой банки «для храбрости». Тебе не страшно.', test: (s) => s.friday13Clean },
  { id: 'night_owl', category: 'logging', hasImage: true, secret: true, title: 'Полуночница', hint: '???', description: 'Отметила день глубокой ночью. Даже не спишь — а о себе помнишь.', test: (s) => s.markedAtNight },
  { id: 'second_wind', category: 'comeback', hasImage: true, secret: true, title: 'Второе дыхание', hint: '???', description: 'После срыва собрала серию в две недели. Вернулась сильнее, чем была.', test: (s) => s.postLapseStreak >= 14 },
  { id: 'phoenix', category: 'comeback', hasImage: true, secret: true, title: 'Феникс', hint: '???', description: 'Даже после нескольких тяжёлых дней подряд ты поднялась. Из пепла — вверх.', test: (s) => s.phoenix },
]

/** Какие ачивки должны быть открыты при текущей статистике. */
export function unlockedIds(stats: AchStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id)
}

/** Ближайшая ещё не достигнутая ачивка по серии (для мотивации «осталось N дней»). */
export function nextAchievement(currentStreak: number): AchievementDef | null {
  return (
    ACHIEVEMENTS.find(
      (a) => a.category === 'streak' && a.goal != null && a.goal > currentStreak,
    ) ?? null
  )
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

/** Путь к картинке ачивки (или null, если арт ещё не добавлен). */
export function achievementImage(a: AchievementDef): string | null {
  return a.hasImage ? `/achievements/${a.id}.webp` : null
}

// ── расчёт статистики по журналу ───────────────────────────────────
// Чистая функция computeAchStats собирает все сигналы для unlockedIds.
// Разбита на маленькие помощники по группам сигналов.

function daysInMonth(year: number, month1: number): number {
  // month1 — 1-based; день 0 следующего месяца = последний день текущего
  return new Date(year, month1, 0).getDate()
}

/** Идёт ли ключ `b` ровно на следующий календарный день после `a`. */
function isNextDay(a: string, b: string): boolean {
  return b === dateKey(addDays(parseKey(a), 1))
}

/** Сигналы из хронологии отмеченных дней: возвращения, серия учёта, серия после срыва, феникс. */
function chronoSignals(marked: DayEntry[]) {
  let comebacks = 0
  let loggingStreak = 0
  let postLapseStreak = 0
  let phoenix = false
  let logRun = 0
  let cleanRun = 0
  let drankRun = 0
  let prevStatus: DayStatus | null = null
  let prevKey: string | null = null
  let prevCleanKey: string | null = null
  let prevDrankKey: string | null = null
  let seenDrank = false

  for (const e of marked) {
    // серия учёта: любые подряд идущие отмеченные дни
    logRun = prevKey !== null && isNextDay(prevKey, e.date) ? logRun + 1 : 1
    if (logRun > loggingStreak) loggingStreak = logRun
    prevKey = e.date

    if (e.status === 'drank') {
      seenDrank = true
      cleanRun = 0
      prevCleanKey = null
      drankRun = prevDrankKey !== null && isNextDay(prevDrankKey, e.date) ? drankRun + 1 : 1
      prevDrankKey = e.date
    } else {
      cleanRun = prevCleanKey !== null && isNextDay(prevCleanKey, e.date) ? cleanRun + 1 : 1
      prevCleanKey = e.date
      if (prevStatus === 'drank') comebacks++
      if (seenDrank && cleanRun > postLapseStreak) postLapseStreak = cleanRun
      // феникс: чистый день после 3+ срывов подряд
      if (prevStatus === 'drank' && drankRun >= 3) phoenix = true
      drankRun = 0
      prevDrankKey = null
    }
    prevStatus = e.status
  }
  return { comebacks, loggingStreak, postLapseStreak, phoenix }
}

/** Календарные узоры по чистым дням: выходные, идеальные недели, понедельники, пасхалки. */
function calendarSignals(clean: DayEntry[], hasClean: (key: string) => boolean) {
  let cleanWeekends = 0
  let fullCalendarWeeks = 0
  let cleanMondays = 0
  let friday13Clean = false
  let leapDayClean = false

  for (const e of clean) {
    const d = parseKey(e.date)
    const dow = d.getDay() // 0=вс … 6=сб
    if (e.date.slice(5) === '02-29') leapDayClean = true
    if (dow === 5 && e.date.slice(8, 10) === '13') friday13Clean = true
    if (dow === 6 && hasClean(dateKey(addDays(d, 1)))) cleanWeekends++
    if (dow === 1) {
      cleanMondays++
      const fullWeek = [1, 2, 3, 4, 5, 6].every((i) => hasClean(dateKey(addDays(d, i))))
      if (fullWeek) fullCalendarWeeks++
    }
  }
  return {
    cleanWeekends,
    fullCalendarWeeks,
    cleanMondays,
    friday13Clean,
    leapDayClean,
  }
}

/** Сигналы по календарным месяцам: лучший месяц, идеальный месяц, охват месяцев. */
function monthSignals(clean: DayEntry[]) {
  const byMonth = new Map<string, number>()
  for (const e of clean) {
    const ym = e.date.slice(0, 7)
    byMonth.set(ym, (byMonth.get(ym) ?? 0) + 1)
  }
  let bestMonthClean = 0
  let fullCalendarMonth = false
  for (const [ym, n] of byMonth) {
    if (n > bestMonthClean) bestMonthClean = n
    const [y, m] = ym.split('-').map(Number)
    if (n === daysInMonth(y, m)) fullCalendarMonth = true
  }
  return { bestMonthClean, fullCalendarMonth, distinctCleanMonths: byMonth.size }
}

export function computeAchStats(entries: DayEntry[]): AchStats {
  const clean = entries.filter((e) => e.status === 'clean')
  const cleanSet = new Set(clean.map((e) => e.date))
  const hasClean = (key: string) => cleanSet.has(key)

  const marked = entries
    .filter((e) => e.status === 'clean' || e.status === 'drank')
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  // отметка глубокой ночью (00:00–04:59 по времени последней правки)
  const markedAtNight = entries.some((e) => {
    if (!e.updatedAt) return false
    const h = new Date(e.updatedAt).getHours()
    return h >= 0 && h < 5
  })

  return {
    best: computeBestStreak(toEntryMap(entries)),
    totalClean: clean.length,
    totalDrank: entries.filter((e) => e.status === 'drank').length,
    totalMarked: marked.length,
    notes: entries.filter((e) => (e.note ?? '').trim().length > 0).length,
    cleanNewYear: clean.some((e) => e.date.slice(5) === '01-01'),
    markedAtNight,
    ...chronoSignals(marked),
    ...calendarSignals(clean, hasClean),
    ...monthSignals(clean),
  }
}
