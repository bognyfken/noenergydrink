// Ачивки за серию дней без энергетика. Тёплые формулировки, без давления.

import type { AchievementDef } from './types'

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'd1', days: 1, title: 'Первый день', description: 'Ты начала. Это самое сложное — и ты смогла.' },
  { id: 'd3', days: 3, title: 'Три дня', description: 'Тело уже говорит спасибо. Так держать!' },
  { id: 'd7', days: 7, title: 'Неделя', description: 'Целая неделя без банки. Это сила.' },
  { id: 'd14', days: 14, title: 'Две недели', description: 'Новая привычка уже формируется.' },
  { id: 'd30', days: 30, title: 'Месяц', description: 'Месяц силы воли. Я горжусь тобой.' },
  { id: 'd60', days: 60, title: 'Два месяца', description: 'Это уже образ жизни, а не борьба.' },
  { id: 'd100', days: 100, title: '100 дней', description: 'Сотня. Ты невероятная. 💜' },
]

/** Какие ачивки должны быть открыты при достигнутом рекорде серии. */
export function unlockedIdsForStreak(bestStreak: number): string[] {
  return ACHIEVEMENTS.filter((a) => bestStreak >= a.days).map((a) => a.id)
}

/** Ближайшая ещё не достигнутая ачивка (для мотивации «осталось N дней»). */
export function nextAchievement(currentStreak: number): AchievementDef | null {
  return ACHIEVEMENTS.find((a) => a.days > currentStreak) ?? null
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}
