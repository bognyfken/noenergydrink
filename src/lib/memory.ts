// Долговременная память Кабанёнка об Олесе (wiki-подобная: стабильные факты +
// хвост недавнего + ограничение размера). Хранится в meta-строке профиля
// (ключ 'assistant_memory'), синхронизируется как остальные данные.
//
// Цель — чтобы помощник не начинал каждый разговор с чистого листа и мог
// сказать «вчера тебе было тяжело, ты сорвалась — как ты сейчас?».

export interface AssistantMemory {
  /** стабильные факты: что помогает, триггеры, мотивация, важные люди/события */
  profile: string[]
  /** хвост недавних событий/состояний, новые в конце */
  recent: string[]
  updatedAt: number
}

export const EMPTY_MEMORY: AssistantMemory = { profile: [], recent: [], updatedAt: 0 }

/** Сколько недавних записей держим, прежде чем самые старые вытесняются. */
const RECENT_CAP = 15

/** Добавить запись в память (с дедупликацией и ограничением размера). */
export function addToMemory(
  m: AssistantMemory,
  section: 'profile' | 'recent',
  note: string,
): AssistantMemory {
  const clean = note.trim()
  if (!clean) return m

  if (section === 'profile') {
    if (m.profile.includes(clean)) return m
    return { ...m, profile: [...m.profile, clean], updatedAt: Date.now() }
  }

  // recent: добавляем в конец, вытесняем старое сверх лимита
  const recent = [...m.recent, clean].slice(-RECENT_CAP)
  return { ...m, recent, updatedAt: Date.now() }
}

/** Текст памяти для вставки в системный промпт (пусто → ''). */
export function renderMemory(m: AssistantMemory): string {
  const parts: string[] = []
  if (m.profile.length) {
    parts.push('Стабильное:\n' + m.profile.map((p) => `  • ${p}`).join('\n'))
  }
  if (m.recent.length) {
    parts.push('Недавнее:\n' + m.recent.map((r) => `  • ${r}`).join('\n'))
  }
  return parts.join('\n\n')
}
