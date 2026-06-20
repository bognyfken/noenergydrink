// Zustand-стор — источник правды в рантайме.
// Правки идут оптимистично в стор + Dexie (мгновенно, офлайн) и пушатся в Supabase.

import { create } from 'zustand'
import type { DayEntry, DayStatus, UnlockedAchievement } from './types'
import {
  deleteEntry as dexieDelete,
  getAllEntries,
  getUnlocked,
  openDb,
  putEntry as dexiePut,
  putUnlocked,
} from './db'
import {
  cloudDeleteEntry,
  cloudFetchAchievements,
  cloudFetchEntries,
  cloudUpsertAchievement,
  cloudUpsertEntry,
  setActiveUserId,
} from './supabase'
import {
  clearDeviceProfile,
  getDeviceProfile,
  setDeviceProfile,
  type DeviceProfile,
  type Session,
} from './auth'
import { toEntryMap, computeBestStreak } from './streak'
import { unlockedIds } from './achievements'

interface AppState {
  session: Session | null
  /** профиль, запомненный на устройстве (для экрана ввода кода). */
  device: DeviceProfile | null
  /** прошла ли первичная проверка (чтобы не мигать экраном входа). */
  authReady: boolean
  entries: Record<string, DayEntry>
  unlocked: Record<string, UnlockedAchievement>
  hydrated: boolean
  /** id ачивок, открытых только что (для анимации/тоста). Очищается потребителем. */
  justUnlocked: string[]

  init: () => Promise<void>
  /** войти по коду; при первом входе/смене профиля передаётся device для запоминания. */
  login: (session: Session, device?: DeviceProfile) => Promise<void>
  logout: () => void
  /** забыть профиль устройства и уйти к выбору/созданию профиля. */
  forgetDevice: () => void
  hydrate: () => Promise<void>
  setDay: (date: string, status: DayStatus, note?: string) => Promise<void>
  setNote: (date: string, note: string) => Promise<void>
  clearDay: (date: string) => Promise<void>
  consumeJustUnlocked: () => void
  /** приватное: пересчитать открытые ачивки на основе записей. */
  _reconcileAchievements: () => void
}

/** активировать профиль: открыть его базу и выставить user_id для облака. */
function activate(s: Session) {
  openDb(s.did)
  setActiveUserId(s.did)
}

function mergeByUpdatedAt(local: DayEntry[], cloud: DayEntry[]): DayEntry[] {
  const map = new Map<string, DayEntry>()
  for (const e of local) map.set(e.date, e)
  for (const e of cloud) {
    const cur = map.get(e.date)
    if (!cur || e.updatedAt >= cur.updatedAt) map.set(e.date, e)
  }
  return [...map.values()]
}

export const useStore = create<AppState>((set, get) => ({
  session: null,
  device: null,
  authReady: false,
  entries: {},
  unlocked: {},
  hydrated: false,
  justUnlocked: [],

  init: async () => {
    set({ device: getDeviceProfile(), authReady: true })
  },

  login: async (s, device) => {
    if (device) setDeviceProfile(device)
    activate(s)
    set((st) => ({
      session: s,
      device: device ?? st.device,
      entries: {},
      unlocked: {},
      hydrated: false,
      justUnlocked: [],
    }))
    await get().hydrate()
  },

  logout: () => {
    clearDeviceProfile()
    setActiveUserId('default')
    set({ session: null, device: null, entries: {}, unlocked: {}, hydrated: false, justUnlocked: [] })
  },

  forgetDevice: () => {
    clearDeviceProfile()
    set({ device: null, session: null })
  },

  hydrate: async () => {
    const [local, cloud, localAch, cloudAch] = await Promise.all([
      getAllEntries(),
      cloudFetchEntries(),
      getUnlocked(),
      cloudFetchAchievements(),
    ])

    const merged = mergeByUpdatedAt(local, cloud)
    const entries: Record<string, DayEntry> = {}
    for (const e of merged) entries[e.date] = e

    // докинуть расхождения в обе стороны (фоном, без ожидания)
    const localMap = new Map(local.map((e) => [e.date, e]))
    const cloudMap = new Map(cloud.map((e) => [e.date, e]))
    for (const e of merged) {
      const l = localMap.get(e.date)
      if (!l || l.updatedAt < e.updatedAt) void dexiePut(e)
      const c = cloudMap.get(e.date)
      if (!c || c.updatedAt < e.updatedAt) void cloudUpsertEntry(e)
    }

    const unlocked: Record<string, UnlockedAchievement> = {}
    for (const a of [...localAch, ...cloudAch]) {
      const cur = unlocked[a.id]
      if (!cur || a.unlockedAt < cur.unlockedAt) unlocked[a.id] = a
    }

    // досылаем недостающие ачивки в обе стороны (как и записи дней)
    const localAchMap = new Map(localAch.map((a) => [a.id, a]))
    const cloudAchMap = new Map(cloudAch.map((a) => [a.id, a]))
    for (const a of Object.values(unlocked)) {
      if (!localAchMap.has(a.id)) void putUnlocked(a)
      if (!cloudAchMap.has(a.id)) void cloudUpsertAchievement(a)
    }

    set({ entries, unlocked, hydrated: true })
    get()._reconcileAchievements()
  },

  setDay: async (date, status, note) => {
    const entry: DayEntry = {
      date,
      status,
      note: note ?? get().entries[date]?.note,
      updatedAt: Date.now(),
    }
    set((s) => ({ entries: { ...s.entries, [date]: entry } }))
    void dexiePut(entry)
    void cloudUpsertEntry(entry)
    get()._reconcileAchievements()
  },

  setNote: async (date, note) => {
    const prev = get().entries[date]
    const entry: DayEntry = {
      date,
      status: prev?.status ?? 'clean',
      note,
      updatedAt: Date.now(),
    }
    set((s) => ({ entries: { ...s.entries, [date]: entry } }))
    void dexiePut(entry)
    void cloudUpsertEntry(entry)
  },

  clearDay: async (date) => {
    set((s) => {
      const next = { ...s.entries }
      delete next[date]
      return { entries: next }
    })
    void dexieDelete(date)
    void cloudDeleteEntry(date)
    get()._reconcileAchievements()
  },

  consumeJustUnlocked: () => set({ justUnlocked: [] }),

  // ── приватное: пересчёт открытых ачивок ───────────────────────────────
  _reconcileAchievements: () => {
    const { entries, unlocked } = get()
    const vals = Object.values(entries)
    const best = computeBestStreak(toEntryMap(vals))
    const totalClean = vals.filter((e) => e.status === 'clean').length

    // возвращение: чистый день после когда-то случившегося срыва
    let seenDrank = false
    let comeback = false
    for (const e of [...vals].sort((a, b) => (a.date < b.date ? -1 : 1))) {
      if (e.status === 'drank') seenDrank = true
      else if (e.status === 'clean' && seenDrank) {
        comeback = true
        break
      }
    }

    const shouldBe = unlockedIds({ best, totalClean, comeback })
    const fresh = shouldBe.filter((id) => !unlocked[id])
    if (fresh.length === 0) return

    const now = Date.now()
    const nextUnlocked = { ...unlocked }
    for (const id of fresh) {
      const rec = { id, unlockedAt: now }
      nextUnlocked[id] = rec
      void putUnlocked(rec)
      void cloudUpsertAchievement(rec)
    }
    set((s) => ({
      unlocked: nextUnlocked,
      justUnlocked: [...s.justUnlocked, ...fresh],
    }))
  },
}))
