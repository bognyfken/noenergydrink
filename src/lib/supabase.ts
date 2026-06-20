// Облачная синхронизация через Supabase.
//
// Работает в режиме «прогрессивного улучшения»:
//  - если переменные окружения НЕ заданы — клиент = null, приложение живёт
//    на локальном кеше (Dexie). Всё работает офлайн и без настройки.
//  - как только заданы VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY — включается
//    облако: данные подтягиваются и пушатся (last-write-wins по updatedAt).
//
// Без экрана логина: один логический пользователь, фиксированный USER_ID.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { DayEntry, UnlockedAchievement } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Фиксированный идентификатор единственного пользователя приложения. */
export const USER_ID =
  (import.meta.env.VITE_APP_USER_ID as string | undefined) ?? 'default'

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const cloudEnabled = supabase !== null

// ── Записи дней ──────────────────────────────────────────────────────────

export async function cloudFetchEntries(): Promise<DayEntry[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('entries')
    .select('date, status, note, updated_at')
    .eq('user_id', USER_ID)
  if (error) {
    console.warn('[supabase] fetch entries:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    date: r.date as string,
    status: r.status as DayEntry['status'],
    note: (r.note as string | null) ?? undefined,
    updatedAt: new Date(r.updated_at as string).getTime(),
  }))
}

export async function cloudUpsertEntry(entry: DayEntry): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('entries').upsert(
    {
      user_id: USER_ID,
      date: entry.date,
      status: entry.status,
      note: entry.note ?? null,
      updated_at: new Date(entry.updatedAt).toISOString(),
    },
    { onConflict: 'user_id,date' },
  )
  if (error) console.warn('[supabase] upsert entry:', error.message)
}

export async function cloudDeleteEntry(date: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('user_id', USER_ID)
    .eq('date', date)
  if (error) console.warn('[supabase] delete entry:', error.message)
}

// ── Ачивки ───────────────────────────────────────────────────────────────

export async function cloudFetchAchievements(): Promise<UnlockedAchievement[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('achievements')
    .select('id, unlocked_at')
    .eq('user_id', USER_ID)
  if (error) {
    console.warn('[supabase] fetch achievements:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    unlockedAt: new Date(r.unlocked_at as string).getTime(),
  }))
}

export async function cloudUpsertAchievement(a: UnlockedAchievement): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('achievements').upsert(
    {
      user_id: USER_ID,
      id: a.id,
      unlocked_at: new Date(a.unlockedAt).toISOString(),
    },
    { onConflict: 'user_id,id' },
  )
  if (error) console.warn('[supabase] upsert achievement:', error.message)
}
