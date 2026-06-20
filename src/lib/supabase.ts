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
import type { ChatMessage, ChatRole, DayEntry, UnlockedAchievement } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Активный user_id данных (секретный did после входа). Меняется при login/logout.
let USER_ID = 'default'
export function setActiveUserId(id: string): void {
  USER_ID = id
}
export function getActiveUserId(): string {
  return USER_ID
}

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const cloudEnabled = supabase !== null

// ── Профили ────────────────────────────────────────────────────────────────

export interface CloudProfile {
  id: string
  name: string
  salt: string
  verifier: string
}

export async function cloudListProfiles(): Promise<CloudProfile[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, salt, verifier')
    .order('created_at')
  if (error) {
    console.warn('[supabase] list profiles:', error.message)
    return []
  }
  return (data ?? []) as CloudProfile[]
}

export async function cloudCreateProfile(p: CloudProfile): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from('profiles').insert(p)
  if (error) {
    console.warn('[supabase] create profile:', error.message)
    return false
  }
  return true
}

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

// ── Сообщения чата ─────────────────────────────────────────────────────────

export async function cloudFetchMessages(): Promise<ChatMessage[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at, conversation_id')
    .eq('user_id', USER_ID)
    .order('created_at')
  if (error) {
    console.warn('[supabase] fetch messages:', error.message)
    return []
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    role: r.role as ChatRole,
    content: r.content as string,
    createdAt: new Date(r.created_at as string).getTime(),
    conversationId: (r.conversation_id as string | null) ?? undefined,
  }))
}

export async function cloudUpsertMessage(m: ChatMessage): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('messages').upsert(
    {
      user_id: USER_ID,
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: new Date(m.createdAt).toISOString(),
      conversation_id: m.conversationId ?? null,
    },
    { onConflict: 'id' },
  )
  if (error) console.warn('[supabase] upsert message:', error.message)
}

export async function cloudDeleteMessagesByConversation(conversationId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('user_id', USER_ID)
    .eq('conversation_id', conversationId)
  if (error) console.warn('[supabase] delete conversation messages:', error.message)
}

// ── Мета (память помощника, флаги, кеш генерации) ────────────────────────────

export async function cloudFetchMeta<T>(key: string): Promise<T | undefined> {
  if (!supabase) return undefined
  const { data, error } = await supabase
    .from('meta')
    .select('value')
    .eq('user_id', USER_ID)
    .eq('key', key)
    .maybeSingle()
  if (error) {
    console.warn('[supabase] fetch meta:', error.message)
    return undefined
  }
  return (data?.value as T | undefined) ?? undefined
}

export async function cloudUpsertMeta(key: string, value: unknown): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('meta')
    .upsert({ user_id: USER_ID, key, value }, { onConflict: 'user_id,key' })
  if (error) console.warn('[supabase] upsert meta:', error.message)
}
