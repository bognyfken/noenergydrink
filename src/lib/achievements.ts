// Ачивки: за серию подряд, за всего чистых дней и за возвращение после срыва.
// Тёплые формулировки, без давления. Картинки — public/achievements/<id>.webp.

export type AchievementKind = 'streak' | 'total' | 'comeback'

export interface AchievementDef {
  id: string
  title: string
  description: string // когда открыта — тёплая похвала
  hint: string // когда закрыта — что нужно сделать
  kind: AchievementKind
  goal: number
  hasImage: boolean
}

export interface AchStats {
  best: number // рекорд серии подряд
  totalClean: number // всего дней без энергетика (не подряд)
  comeback: boolean // был срыв, после которого снова отметила чистый день
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── серия подряд ──
  { id: 'd1', kind: 'streak', goal: 1, hasImage: true, title: 'Первый день', hint: '1 день подряд', description: 'Ты начала. Самый трудный шаг уже позади 💜' },
  { id: 'd3', kind: 'streak', goal: 3, hasImage: true, title: 'Три дня', hint: '3 дня подряд', description: 'Тело уже благодарит тебя. Чувствуешь?' },
  { id: 'd7', kind: 'streak', goal: 7, hasImage: true, title: 'Неделя', hint: '7 дней подряд', description: 'Целая неделя без банки. Это настоящая сила.' },
  { id: 'd14', kind: 'streak', goal: 14, hasImage: true, title: 'Две недели', hint: '14 дней подряд', description: 'Привычка уже меняется. Ты большая молодец.' },
  { id: 'd30', kind: 'streak', goal: 30, hasImage: true, title: 'Месяц', hint: '30 дней подряд', description: 'Целый месяц! Я очень тобой горжусь.' },
  { id: 'd60', kind: 'streak', goal: 60, hasImage: true, title: 'Два месяца', hint: '60 дней подряд', description: 'Это уже образ жизни, а не борьба.' },
  { id: 'd100', kind: 'streak', goal: 100, hasImage: true, title: '100 дней', description: 'Сотня дней. Ты невероятная 💜', hint: '100 дней подряд' },
  { id: 'd180', kind: 'streak', goal: 180, hasImage: false, title: 'Полгода', hint: '180 дней подряд', description: 'Полгода свободы. Ты переписала свою историю.' },
  { id: 'd365', kind: 'streak', goal: 365, hasImage: false, title: 'Целый год', hint: '365 дней подряд', description: 'Год без энергетиков. Это победа на всю жизнь.' },
  // ── всего чистых дней ──
  { id: 'total30', kind: 'total', goal: 30, hasImage: false, title: '30 чистых дней', hint: 'всего 30 дней без энергетика', description: '30 дней без банки в сумме. Каждый — на счету.' },
  { id: 'total100', kind: 'total', goal: 100, hasImage: false, title: '100 чистых дней', hint: 'всего 100 дней без энергетика', description: 'Сто чистых дней суммарно. Огромный путь.' },
  // ── возвращение ──
  { id: 'comeback', kind: 'comeback', goal: 1, hasImage: false, title: 'Возвращение', hint: 'вернуться после срыва', description: 'Сорваться — не провал. Вернуться — вот что важно.' },
]

/** Какие ачивки должны быть открыты при текущей статистике. */
export function unlockedIds(stats: AchStats): string[] {
  return ACHIEVEMENTS.filter((a) => {
    if (a.kind === 'streak') return stats.best >= a.goal
    if (a.kind === 'total') return stats.totalClean >= a.goal
    return stats.comeback
  }).map((a) => a.id)
}

/** Ближайшая ещё не достигнутая ачивка по серии (для мотивации «осталось N дней»). */
export function nextAchievement(currentStreak: number): AchievementDef | null {
  return ACHIEVEMENTS.find((a) => a.kind === 'streak' && a.goal > currentStreak) ?? null
}

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

/** Путь к картинке ачивки (или null, если арт ещё не добавлен). */
export function achievementImage(a: AchievementDef): string | null {
  return a.hasImage ? `/achievements/${a.id}.webp` : null
}
