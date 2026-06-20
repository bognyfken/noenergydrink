// Локальный кеш на IndexedDB через Dexie. Источник правды для офлайна;
// при наличии сети синхронизируется с Supabase (см. supabase.ts).
//
// База именуется по профилю (did) → данные разных профилей на одном устройстве
// не смешиваются. Активная база открывается при входе через openDb(did).

import Dexie, { type Table } from 'dexie'
import type { ChatMessage, DayEntry, MetaRow, UnlockedAchievement } from './types'

export class AppDB extends Dexie {
  entries!: Table<DayEntry, string>
  achievements!: Table<UnlockedAchievement, string>
  messages!: Table<ChatMessage, string>
  meta!: Table<MetaRow, string>

  constructor(namespace: string) {
    super(`net-energetikam-${namespace}`)
    this.version(1).stores({
      entries: 'date, status, updatedAt',
      achievements: 'id, unlockedAt',
      messages: 'id, createdAt',
      meta: 'key',
    })
  }
}

let active: AppDB | null = null

/** Открыть (или переключить) локальную базу профиля. */
export function openDb(namespace: string): AppDB {
  if (active && active.name === `net-energetikam-${namespace}`) return active
  active?.close()
  active = new AppDB(namespace)
  return active
}

function db(): AppDB {
  if (!active) throw new Error('Локальная база не открыта (нет активного профиля)')
  return active
}

// ── удобные обёртки ──────────────────────────────────────────────────────

export async function getAllEntries(): Promise<DayEntry[]> {
  return db().entries.toArray()
}

export async function putEntry(entry: DayEntry): Promise<void> {
  await db().entries.put(entry)
}

export async function deleteEntry(date: string): Promise<void> {
  await db().entries.delete(date)
}

export async function getUnlocked(): Promise<UnlockedAchievement[]> {
  return db().achievements.toArray()
}

export async function putUnlocked(a: UnlockedAchievement): Promise<void> {
  await db().achievements.put(a)
}

// ── Сообщения чата с Кабанёнком ──────────────────────────────────────────

export async function getAllMessages(): Promise<ChatMessage[]> {
  return db().messages.orderBy('createdAt').toArray()
}

export async function putMessage(m: ChatMessage): Promise<void> {
  await db().messages.put(m)
}

export async function clearMessages(): Promise<void> {
  await db().messages.clear()
}

// ── Произвольные мета-настройки (память, флаги, кеш генерации) ─────────────

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await db().meta.get(key)
  return row?.value as T | undefined
}

export async function putMeta(key: string, value: unknown): Promise<void> {
  await db().meta.put({ key, value })
}
