// Zustand-стор — источник правды в рантайме.
// Правки идут оптимистично в стор + Dexie (мгновенно, офлайн) и пушатся в Supabase.

import { create } from 'zustand'
import type { ChatMessage, DayEntry, DayStatus, UnlockedAchievement } from './types'
import {
  clearMessages,
  deleteEntry as dexieDelete,
  getAllEntries,
  getAllMessages,
  getMeta,
  getUnlocked,
  openDb,
  putEntry as dexiePut,
  putMessage,
  putMeta,
  putUnlocked,
} from './db'
import {
  cloudDeleteEntry,
  cloudFetchAchievements,
  cloudFetchEntries,
  cloudFetchMessages,
  cloudFetchMeta,
  cloudUpsertAchievement,
  cloudUpsertEntry,
  cloudUpsertMessage,
  cloudUpsertMeta,
  setActiveUserId,
} from './supabase'
import {
  clearDeviceProfile,
  getDeviceProfile,
  setDeviceProfile,
  type DeviceProfile,
  type Session,
} from './auth'
import { computeAchStats, unlockedIds } from './achievements'
import {
  chat,
  chatAfterTools,
  generateWarmContent,
  KabanenokError,
  type AiMessage,
  type ToolCall,
  type WarmContent,
} from './ai'
import { addToMemory, EMPTY_MEMORY, type AssistantMemory } from './memory'
import { buildContext, chatMessagesToAi } from './assistant'
import { humanDay, todayKey } from './date'

// Ключи meta-хранилища (память помощника, флаги, кеш генерации).
const META_MEMORY = 'assistant_memory'
const META_GREETING = 'greeting_enabled'
const META_WARM = 'warm'

/** Действие Кабанёнка с днём — для плашки «отменить». */
export interface ToolAction {
  kind: 'set_day_status' | 'add_day_note'
  date: string
  human: string
  /** короткая подпись для плашки, напр. «19 июня — без энергетика» */
  label: string
  /** прежнее состояние дня для отката (null = дня не было) */
  prev: DayEntry | null
}

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

  // ── Кабанёнок (ИИ-помощник) ──────────────────────────────────────────────
  /** история чата (источник правды для UI) */
  messages: ChatMessage[]
  /** идёт обращение к помощнику */
  chatBusy: boolean
  /** последняя ошибка обращения (для мягкого сообщения в UI) */
  chatError: string | null
  /** долговременная память об Олесе */
  memory: AssistantMemory
  /** тёплый контент главного экрана: показываем сейчас */
  warm: WarmContent | null
  /** пред-сгенерированный контент на следующее открытие */
  warmNext: WarmContent | null
  /** встречает ли Кабанёнок при открытии (по умолчанию да) */
  greetingEnabled: boolean
  /** что Кабанёнок только что записал в дни (для плашки «отменить») */
  lastToolActions: ToolAction[]

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

  // ── Кабанёнок ─────────────────────────────────────────────────────────────
  /** отправить сообщение помощнику (с исполнением его инструментов). */
  sendMessage: (text: string) => Promise<void>
  /** дописать заметку к дню (merge, не затирая прежнюю). */
  appendNote: (date: string, text: string) => Promise<void>
  /** очистить историю чата (локально). */
  clearChat: () => Promise<void>
  /** включить/выключить приветствие при открытии. */
  setGreetingEnabled: (on: boolean) => Promise<void>
  /** показать новый набор мотивации/быстрых ответов и пред-сгенерировать следующий. */
  refreshWarmContent: () => Promise<void>
  /** откатить последние действия Кабанёнка с днями. */
  undoLastToolActions: () => Promise<void>
  /** скрыть плашку действий без отката. */
  dismissToolActions: () => void

  /** приватное: пересчитать открытые ачивки на основе записей. */
  _reconcileAchievements: () => void
  /** приватное: подгрузить чат/память/настройки помощника. */
  _loadAssistant: () => Promise<void>
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

/** Выбрать более свежую версию памяти (по updatedAt). */
function pickNewerMemory(a?: AssistantMemory, b?: AssistantMemory): AssistantMemory {
  if (!a && !b) return EMPTY_MEMORY
  if (!a) return b as AssistantMemory
  if (!b) return a
  return a.updatedAt >= b.updatedAt ? a : b
}

/** Сохранить кеш тёплого контента (локально + в облако). */
function persistWarm(get: () => AppState): void {
  const { warm, warmNext } = get()
  const payload = { current: warm, next: warmNext }
  void putMeta(META_WARM, payload)
  void cloudUpsertMeta(META_WARM, payload)
}

/** Исполнить один вызов инструмента Кабанёнка → текст-результат для модели + действие для плашки. */
async function runTool(
  call: ToolCall,
  get: () => AppState,
  set: (partial: Partial<AppState>) => void,
): Promise<{ result: string; action: ToolAction | null }> {
  let args: Record<string, unknown> = {}
  try {
    args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>
  } catch {
    /* кривые аргументы — работаем с пустыми */
  }
  const today = todayKey()

  switch (call.function.name) {
    case 'set_day_status': {
      const date = typeof args.date === 'string' ? args.date : today
      const status: DayStatus = args.status === 'drank' ? 'drank' : 'clean'
      const prev = get().entries[date] ?? null
      await get().setDay(date, status)
      const word = status === 'clean' ? 'без энергетика' : 'срыв'
      return {
        result: `Отметил день ${humanDay(date)} как «${word}».`,
        action: { kind: 'set_day_status', date, human: humanDay(date), label: `${humanDay(date)} — ${word}`, prev },
      }
    }
    case 'add_day_note': {
      const date = typeof args.date === 'string' ? args.date : today
      const text = typeof args.text === 'string' ? args.text.trim() : ''
      if (!text) return { result: 'Заметка пустая, пропустил.', action: null }
      const prev = get().entries[date] ?? null
      await get().appendNote(date, text)
      return {
        result: `Записал заметку к ${humanDay(date)}.`,
        action: { kind: 'add_day_note', date, human: humanDay(date), label: `заметка к ${humanDay(date)}`, prev },
      }
    }
    case 'remember': {
      const section = args.section === 'profile' ? 'profile' : 'recent'
      const note = typeof args.note === 'string' ? args.note : ''
      if (note.trim()) {
        const memory = addToMemory(get().memory, section, note)
        set({ memory })
        void putMeta(META_MEMORY, memory)
        void cloudUpsertMeta(META_MEMORY, memory)
      }
      return { result: 'Запомнил.', action: null }
    }
    default:
      return { result: 'Неизвестное действие.', action: null }
  }
}

export const useStore = create<AppState>((set, get) => ({
  session: null,
  device: null,
  authReady: false,
  entries: {},
  unlocked: {},
  hydrated: false,
  justUnlocked: [],
  messages: [],
  chatBusy: false,
  chatError: null,
  memory: EMPTY_MEMORY,
  warm: null,
  warmNext: null,
  greetingEnabled: true,
  lastToolActions: [],

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
      messages: [],
      chatBusy: false,
      chatError: null,
      memory: EMPTY_MEMORY,
      warm: null,
      warmNext: null,
      greetingEnabled: true,
      lastToolActions: [],
    }))
    await get().hydrate()
  },

  logout: () => {
    clearDeviceProfile()
    setActiveUserId('default')
    set({
      session: null,
      device: null,
      entries: {},
      unlocked: {},
      hydrated: false,
      justUnlocked: [],
      messages: [],
      chatBusy: false,
      chatError: null,
      memory: EMPTY_MEMORY,
      warm: null,
      warmNext: null,
      greetingEnabled: true,
      lastToolActions: [],
    })
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
    void get()._loadAssistant()
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

  // ── Кабанёнок ─────────────────────────────────────────────────────────────

  sendMessage: async (text) => {
    const clean = text.trim()
    if (!clean || get().chatBusy) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: clean,
      createdAt: Date.now(),
    }
    set((s) => ({
      messages: [...s.messages, userMsg],
      chatBusy: true,
      chatError: null,
      lastToolActions: [],
    }))
    void putMessage(userMsg)
    void cloudUpsertMessage(userMsg)

    try {
      const history = chatMessagesToAi(get().messages)
      let reply = await chat(buildContext(get().entries, get().memory), history)

      const actions: ToolAction[] = []
      if (reply.tool_calls?.length) {
        const toolResults: AiMessage[] = []
        for (const call of reply.tool_calls) {
          const { result, action } = await runTool(call, get, set)
          toolResults.push({
            role: 'tool',
            tool_call_id: call.id,
            name: call.function.name,
            content: result,
          })
          if (action) actions.push(action)
        }
        // финальный тёплый ответ с учётом выполненного (контекст уже обновлён)
        reply = await chatAfterTools(
          buildContext(get().entries, get().memory),
          [...history, reply],
          toolResults,
        )
      }

      const botText = (reply.content ?? '').trim() || 'Я рядом 💜'
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: botText,
        createdAt: Date.now(),
        toolResult: actions.length ? actions.map((a) => a.label).join(', ') : undefined,
      }
      set((s) => ({ messages: [...s.messages, botMsg], lastToolActions: actions }))
      void putMessage(botMsg)
      void cloudUpsertMessage(botMsg)
    } catch (e) {
      const msg =
        e instanceof KabanenokError ? e.message : 'Ой, что-то пошло не так. Попробуй ещё раз 💜'
      set({ chatError: msg })
    } finally {
      set({ chatBusy: false })
    }
  },

  appendNote: async (date, text) => {
    const prev = get().entries[date]
    const note = prev?.note ? `${prev.note}\n${text}` : text
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

  clearChat: async () => {
    set({ messages: [], chatError: null, lastToolActions: [] })
    void clearMessages()
  },

  setGreetingEnabled: async (on) => {
    set({ greetingEnabled: on })
    void putMeta(META_GREETING, on)
    void cloudUpsertMeta(META_GREETING, on)
  },

  refreshWarmContent: async () => {
    // показать пред-сгенерированный набор, чтобы при открытии была НОВАЯ фраза
    if (get().warmNext) {
      set((s) => ({ warm: s.warmNext, warmNext: null }))
      persistWarm(get)
    }
    // если показывать всё ещё нечего — сгенерировать сейчас
    if (!get().warm) {
      try {
        const w = await generateWarmContent(buildContext(get().entries, get().memory))
        set({ warm: w })
        persistWarm(get)
      } catch {
        /* офлайн/ошибка — UI покажет запасную строку */
      }
    }
    // подготовить набор на следующее открытие
    if (!get().warmNext) {
      try {
        const w = await generateWarmContent(buildContext(get().entries, get().memory))
        set({ warmNext: w })
        persistWarm(get)
      } catch {
        /* не критично */
      }
    }
  },

  undoLastToolActions: async () => {
    const actions = get().lastToolActions
    if (!actions.length) return
    for (const a of actions) {
      if (a.prev) {
        const entry = a.prev
        set((s) => ({ entries: { ...s.entries, [a.date]: entry } }))
        void dexiePut(entry)
        void cloudUpsertEntry(entry)
      } else {
        set((s) => {
          const next = { ...s.entries }
          delete next[a.date]
          return { entries: next }
        })
        void dexieDelete(a.date)
        void cloudDeleteEntry(a.date)
      }
    }
    set({ lastToolActions: [] })
    get()._reconcileAchievements()
  },

  dismissToolActions: () => set({ lastToolActions: [] }),

  _loadAssistant: async () => {
    const [msgsLocal, msgsCloud, memLocal, memCloud, greetLocal, greetCloud, warmLocal] =
      await Promise.all([
        getAllMessages(),
        cloudFetchMessages(),
        getMeta<AssistantMemory>(META_MEMORY),
        cloudFetchMeta<AssistantMemory>(META_MEMORY),
        getMeta<boolean>(META_GREETING),
        cloudFetchMeta<boolean>(META_GREETING),
        getMeta<{ current: WarmContent | null; next: WarmContent | null }>(META_WARM),
      ])

    // сообщения: объединяем по id, сортируем по времени, докидываем расхождения
    const byId = new Map<string, ChatMessage>()
    for (const m of msgsLocal) byId.set(m.id, m)
    for (const m of msgsCloud) if (!byId.has(m.id)) byId.set(m.id, m)
    const messages = [...byId.values()].sort((a, b) => a.createdAt - b.createdAt)
    const localIds = new Set(msgsLocal.map((m) => m.id))
    const cloudIds = new Set(msgsCloud.map((m) => m.id))
    for (const m of messages) {
      if (!localIds.has(m.id)) void putMessage(m)
      if (!cloudIds.has(m.id)) void cloudUpsertMessage(m)
    }

    // память: берём более свежую, недостающую сторону подтягиваем
    const memory = pickNewerMemory(memLocal, memCloud)
    if (memLocal || memCloud) {
      if (memory !== memLocal) void putMeta(META_MEMORY, memory)
      if (memory !== memCloud) void cloudUpsertMeta(META_MEMORY, memory)
    }

    set({
      messages,
      memory,
      greetingEnabled: greetCloud ?? greetLocal ?? true,
      warm: warmLocal?.current ?? null,
      warmNext: warmLocal?.next ?? null,
    })
  },

  // ── приватное: пересчёт открытых ачивок ───────────────────────────────
  _reconcileAchievements: () => {
    const { entries, unlocked } = get()
    const stats = computeAchStats(Object.values(entries))
    const shouldBe = unlockedIds(stats)
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
