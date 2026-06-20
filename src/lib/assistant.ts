// Чистые помощники для слоя стора: собрать контекст Кабанёнка из состояния и
// привести историю чата к формату сообщений модели. Без побочных эффектов.

import { computeCurrentStreak, toEntryMap } from './streak'
import { dayKeyOffset, humanDay, todayKey } from './date'
import { renderMemory, type AssistantMemory } from './memory'
import type { AiMessage, DaySnapshot, KabanenokContext } from './ai'
import type { ChatMessage, DayEntry } from './types'

/** Сколько последних дней показываем модели как контекст. */
const RECENT_WINDOW = 14

/** Собрать контекст для системного промпта из записей и памяти. */
export function buildContext(
  entries: Record<string, DayEntry>,
  memory: AssistantMemory,
): KabanenokContext {
  const map = toEntryMap(Object.values(entries))
  const today = todayKey()

  const recentDays: DaySnapshot[] = []
  for (let i = 0; i < RECENT_WINDOW; i++) {
    const key = dayKeyOffset(-i)
    const e = entries[key]
    if (e) recentDays.push({ date: key, human: humanDay(key), status: e.status, note: e.note })
  }

  return {
    todayHuman: humanDay(today),
    todayIso: today,
    streak: computeCurrentStreak(map),
    todayStatus: entries[today]?.status ?? 'unmarked',
    recentDays,
    memory: renderMemory(memory),
  }
}

/** История чата → сообщения модели (только реплики Олеси и Кабанёнка). */
export function chatMessagesToAi(msgs: ChatMessage[]): AiMessage[] {
  return msgs
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}
