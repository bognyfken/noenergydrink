// Локальный кеш на IndexedDB через Dexie. Источник правды для офлайна;
// при наличии сети синхронизируется с Supabase (см. supabase.ts).

import Dexie, { type Table } from 'dexie'
import type { ChatMessage, DayEntry, MetaRow, UnlockedAchievement } from './types'

export class AppDB extends Dexie {
  entries!: Table<DayEntry, string>
  achievements!: Table<UnlockedAchievement, string>
  messages!: Table<ChatMessage, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('net-energetikam')
    this.version(1).stores({
      entries: 'date, status, updatedAt',
      achievements: 'id, unlockedAt',
      messages: 'id, createdAt',
      meta: 'key',
    })
  }
}

export const db = new AppDB()

// ── удобные обёртки ──────────────────────────────────────────────────────

export async function getAllEntries(): Promise<DayEntry[]> {
  return db.entries.toArray()
}

export async function putEntry(entry: DayEntry): Promise<void> {
  await db.entries.put(entry)
}

export async function deleteEntry(date: string): Promise<void> {
  await db.entries.delete(date)
}

export async function getUnlocked(): Promise<UnlockedAchievement[]> {
  return db.achievements.toArray()
}

export async function putUnlocked(a: UnlockedAchievement): Promise<void> {
  await db.achievements.put(a)
}
