// Общие типы приложения «Нет энергетикам»

/** Статус дня. `unmarked` обычно не хранится — отсутствие записи = не отмечено. */
export type DayStatus = 'clean' | 'drank' | 'unmarked'

/** Запись об одном дне. Ключ — дата в формате 'YYYY-MM-DD'. */
export interface DayEntry {
  date: string
  status: DayStatus
  note?: string
  /** epoch ms — для разрешения конфликтов синхронизации (last-write-wins). */
  updatedAt: number
}

/** Определение ачивки (майлстоуна серии). */
export interface AchievementDef {
  id: string
  days: number
  title: string
  description: string
}

/** Разблокированная ачивка. */
export interface UnlockedAchievement {
  id: string
  unlockedAt: number
}

export type ChatRole = 'user' | 'assistant' | 'system' | 'tool'

/** Сообщение чата с ИИ-помощником (этап 3). */
export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  createdAt: number
  /** короткое подтверждение выполненного действия ИИ (например, «Записала заметку»). */
  toolResult?: string
}

/** Произвольные мета-настройки (key-value). */
export interface MetaRow {
  key: string
  value: unknown
}
