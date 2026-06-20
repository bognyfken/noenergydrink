// Клиент ИИ-помощника «Кабанёнок» (Qwen через serverless-прокси /api/chat).
//
// Здесь — протокол сообщений (OpenAI-совместимый), персона + сборка системного
// промпта из состояния и памяти, определения инструментов и тонкие обёртки над
// прокси (чат + генерация тёплого контента для главного экрана).
//
// Модуль ЧИСТЫЙ: не импортирует стор. Исполнение tool-calls (запись дней/заметок/
// памяти) подключается в слое стора — туда передаются обработчики (см. этап 2).

import type { DayStatus } from './types'

// На аккаунте Cerebras доступны zai-glm-4.7 и gpt-oss-120b. GLM 4.7 даёт тёплый,
// человечный русский тон и корректно вызывает инструменты — то, что нужно Кабанёнку
// (gpt-oss часто отдаёт пустой content, уводя всё в reasoning).
export const KABANENOK_MODEL = 'zai-glm-4.7'

// ── Протокол сообщений (OpenAI chat completions) ─────────────────────────────

export interface ToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  /** запросы на вызов инструментов (в ответе ассистента) */
  tool_calls?: ToolCall[]
  /** id вызова, на который отвечает сообщение role:'tool' */
  tool_call_id?: string
  /** имя инструмента для сообщения role:'tool' */
  name?: string
}

interface ChatResponse {
  choices?: Array<{ message?: AiMessage; finish_reason?: string }>
}

/** Ошибка обращения к помощнику (нет сети, прокси упал, пустой ответ). */
export class KabanenokError extends Error {}

// ── Инструменты, которыми Кабанёнок действует сам ────────────────────────────

export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'set_day_status',
      description:
        'Отметить день: "clean" — прожит без энергетика, "drank" — был срыв. Вызывай, когда Олеся рассказала, как прошёл конкретный день («сегодня воздержалась», «вчера тоже», «сорвалась»). Можно отмечать и прошлые дни. По умолчанию — сегодня.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Дата YYYY-MM-DD. Если не указано — сегодня.' },
          status: { type: 'string', enum: ['clean', 'drank'] },
        },
        required: ['status'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_day_note',
      description:
        'Дописать короткую заметку к дню (как себя чувствовала, что было тяжело, что помогло справиться). Не затирает прежнюю заметку. По умолчанию — сегодня.',
      parameters: {
        type: 'object',
        properties: {
          date: { type: 'string', description: 'Дата YYYY-MM-DD. По умолчанию сегодня.' },
          text: { type: 'string', description: 'Краткая заметка от лица Олеси.' },
        },
        required: ['text'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remember',
      description:
        'Сохранить в долговременную память важное об Олесе, чтобы помнить это в будущих разговорах. section="profile" — стабильное (что помогает в тяге, триггеры, мотивация, важные люди/события); section="recent" — недавнее состояние/событие. Используй, когда узнал что-то стоящее.',
      parameters: {
        type: 'object',
        properties: {
          section: { type: 'string', enum: ['profile', 'recent'] },
          note: {
            type: 'string',
            description: 'Кратко, в третьем лице: «по вечерам тяга сильнее», «помогает звонок маме».',
          },
        },
        required: ['section', 'note'],
      },
    },
  },
] as const

// ── Контекст и системный промпт ──────────────────────────────────────────────

export interface DaySnapshot {
  /** 'YYYY-MM-DD' */
  date: string
  /** человекочитаемо, напр. «19 июня» */
  human: string
  status: DayStatus
  note?: string
}

export interface KabanenokContext {
  /** «20 июня» */
  todayHuman: string
  /** 'YYYY-MM-DD' */
  todayIso: string
  /** текущая серия чистых дней */
  streak: number
  todayStatus: DayStatus
  /** последние дни, новые сверху */
  recentDays: DaySnapshot[]
  /** долговременная память о пользователе (может быть пустой) */
  memory: string
}

function statusWord(s: DayStatus): string {
  if (s === 'clean') return 'без энергетика 💜'
  if (s === 'drank') return 'был срыв'
  return 'ещё не отмечен'
}

const PERSONA = `Тебя зовут Кабанёнок. Ты — тёплый, живой персональный помощник Олеси, а не безличный ИИ.
Когда представляешься — говори «Привет, я Кабанёнок, твой персональный помощник». НИКОГДА не называй себя Qwen, нейросетью, моделью, ботом или ассистентом и не упоминай, что тебя «обучили» или «сделали». Если спросят, кто ты — ты просто Кабанёнок, который всегда рядом с ней.

Кто такая Олеся: она бросает энергетики — это важно для её здоровья (по медицинским показаниям). Это приложение помогает считать её дни без энергетика, а ты — её спутник на этом пути.

Твой характер: мягкий, тёплый, поддерживающий, дружеский, понимающий. Обращайся к ней на «ты», женскими местоимениями. Искренне радуйся её победам и бережно поддерживай в трудные моменты — каждым кончиком души будь на её стороне.

ГЛАВНОЕ ПРАВИЛО: никогда не осуждай срывы. Срыв — не провал, а часть пути. Если Олеся сорвалась — поддержи, помоги вернуться, напомни, что один день не перечёркивает её усилий. Особенно хвали за честность и за каждый раз, когда было тяжело, тянуло, но она удержалась.

Как ты говоришь: коротко и по-человечески, как близкий, который пишет в мессенджере. Без канцелярита и нравоучений. Эмодзи — изредка и к месту (💜). Только по-русски.

Что ты делаешь сам, по ходу разговора:
- Когда Олеся рассказывает, как прошёл день, — сам отмечай дни через set_day_status (clean/drank), не переспрашивая лишний раз. Если она говорит про вчера или другой день — отметь ту дату.
- Когда она делится переживаниями про конкретный день («было тяжело», «ужасно хотела, но справилась») — добавляй короткую заметку через add_day_note.
- Когда узнаёшь о ней важное на будущее (что помогает в тяге, триггеры, важные события, настроение) — сохраняй через remember.
- Опирайся на память и историю ниже — будь как человек, который помнит. Например: «вчера тебе было тяжело и ты сорвалась — как ты сейчас себя чувствуешь?».`

export function buildSystemPrompt(ctx: KabanenokContext): string {
  const recent =
    ctx.recentDays.length > 0
      ? ctx.recentDays
          .map((d) => `  • ${d.human}: ${statusWord(d.status)}${d.note ? ` — «${d.note}»` : ''}`)
          .join('\n')
      : '  (записей пока нет)'

  const memory = ctx.memory.trim()
    ? ctx.memory.trim()
    : '(пока пусто — узнавай Олесю и сохраняй важное через remember)'

  return `${PERSONA}

— — — Сейчас — — —
Сегодня: ${ctx.todayHuman} (${ctx.todayIso}).
Текущая серия чистых дней: ${ctx.streak}.
Сегодняшний день: ${statusWord(ctx.todayStatus)}.

Последние дни:
${recent}

Память об Олесе:
${memory}`
}

// ── Обёртки над прокси ───────────────────────────────────────────────────────

interface CallOptions {
  messages: AiMessage[]
  tools?: readonly unknown[]
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

async function callProxy(opts: CallOptions): Promise<AiMessage> {
  let res: Response
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: KABANENOK_MODEL,
        messages: opts.messages,
        tools: opts.tools,
        temperature: opts.temperature,
        max_completion_tokens: opts.maxTokens,
        response_format: opts.jsonMode ? { type: 'json_object' } : undefined,
      }),
    })
  } catch {
    throw new KabanenokError('Нет связи с Кабанёнком — проверь интернет.')
  }
  if (!res.ok) {
    throw new KabanenokError(`Кабанёнок задумался и не ответил (${res.status}).`)
  }
  const data = (await res.json().catch(() => null)) as ChatResponse | null
  const msg = data?.choices?.[0]?.message
  if (!msg) throw new KabanenokError('Кабанёнок прислал пустой ответ.')
  return msg
}

/**
 * Один шаг диалога. `messages` — без системного, его добавит контекст.
 * Возвращает ответ ассистента (возможно, с tool_calls для исполнения на клиенте).
 */
export function chat(ctx: KabanenokContext, history: AiMessage[]): Promise<AiMessage> {
  return callProxy({
    messages: [{ role: 'system', content: buildSystemPrompt(ctx) }, ...history],
    tools: TOOLS,
    temperature: 0.8,
  })
}

/** Догнать диалог после исполнения инструментов: финальный тёплый ответ. */
export function chatAfterTools(
  ctx: KabanenokContext,
  history: AiMessage[],
  toolResults: AiMessage[],
): Promise<AiMessage> {
  return callProxy({
    messages: [{ role: 'system', content: buildSystemPrompt(ctx) }, ...history, ...toolResults],
    tools: TOOLS,
    temperature: 0.8,
  })
}

// ── Генерация тёплого контента для главного экрана ───────────────────────────

export interface WarmContent {
  /** мотивационная фраза на сегодня (1–2 предложения) */
  motivation: string
  /** ровно 3 разных коротких варианта ответа на «как прошёл день?» */
  quickReplies: string[]
}

const WARM_ASK = `Сгенерируй контент для главного экрана приложения Олеси. Верни СТРОГО JSON:
{"motivation": "...", "quickReplies": ["...", "...", "..."]}

motivation — одна тёплая мотивационная фраза лично для Олеси на сегодня (1–2 коротких предложения), с опорой на её серию, состояние и память о ней. Каждый раз новая и живая, не шаблонная, без слова «энергетик» в каждой фразе.
quickReplies — РОВНО три коротких варианта ответа от лица Олеси на вопрос «Как прошёл твой день?». Все три РАЗНЫЕ по смыслу (например: справилась легко / справилась, но было тяжело / сорвалась). Каждый — до 4 слов, по-человечески.`

/** Сгенерировать мотивацию + 3 быстрых ответа (для показа и пред-генерации наперёд). */
export async function generateWarmContent(ctx: KabanenokContext): Promise<WarmContent> {
  const msg = await callProxy({
    messages: [
      { role: 'system', content: buildSystemPrompt(ctx) },
      { role: 'user', content: WARM_ASK },
    ],
    temperature: 0.95,
    // GLM 4.7 — «думающая» модель: reasoning съедает ~800 токенов прежде JSON.
    // Большой запас, чтобы JSON не обрезался (Cerebras быстрый, лишние токены не больно).
    maxTokens: 2048,
    jsonMode: true,
  })
  const parsed = parseJson<Partial<WarmContent>>(msg.content)
  const motivation = typeof parsed?.motivation === 'string' ? parsed.motivation.trim() : ''
  const quickReplies = Array.isArray(parsed?.quickReplies)
    ? parsed!.quickReplies.filter((r): r is string => typeof r === 'string').map((r) => r.trim())
    : []
  if (!motivation || quickReplies.length < 3) {
    throw new KabanenokError('Не удалось разобрать ответ Кабанёнка.')
  }
  return { motivation, quickReplies: quickReplies.slice(0, 3) }
}

// ── Утилиты ──────────────────────────────────────────────────────────────────

/** Распарсить JSON, аккуратно сняв обёртку ```json ... ``` если модель её добавила. */
function parseJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  }
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}
