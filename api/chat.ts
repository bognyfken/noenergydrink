// Serverless-прокси к Cerebras (Qwen) для ИИ-помощника «Кабанёнок».
//
// Зачем прокси: ключ CEREBRAS_API_KEY нельзя класть в браузерный бандл.
// Клиент шлёт сюда сообщения/инструменты, сервер добавляет ключ и зовёт Cerebras.
// Cerebras OpenAI-совместим → формат запроса/ответа как у OpenAI chat completions.
//
// Env (Vercel project settings, server-side, БЕЗ префикса VITE_): CEREBRAS_API_KEY.

export const config = { runtime: 'edge' }

const CEREBRAS_URL = 'https://api.cerebras.ai/v1/chat/completions'
const DEFAULT_MODEL = 'zai-glm-4.7'

interface ChatBody {
  messages?: unknown
  tools?: unknown
  tool_choice?: unknown
  model?: string
  temperature?: number
  max_completion_tokens?: number
  response_format?: unknown
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json({ error: 'Только POST' }, 405)
  }

  const key = process.env.CEREBRAS_API_KEY
  if (!key) {
    return json({ error: 'CEREBRAS_API_KEY не задан на сервере' }, 500)
  }

  let body: ChatBody
  try {
    body = (await req.json()) as ChatBody
  } catch {
    return json({ error: 'Некорректный JSON в теле запроса' }, 400)
  }

  if (!Array.isArray(body.messages)) {
    return json({ error: 'Нужно поле messages (массив)' }, 400)
  }

  // Собираем payload из аллоулиста полей (не пробрасываем что попало).
  const payload: Record<string, unknown> = {
    model: body.model ?? DEFAULT_MODEL,
    messages: body.messages,
    temperature: body.temperature ?? 0.8,
    max_completion_tokens: body.max_completion_tokens ?? 1024,
  }
  if (body.tools) {
    payload.tools = body.tools
    payload.tool_choice = body.tool_choice ?? 'auto'
  }
  if (body.response_format) payload.response_format = body.response_format

  try {
    const upstream = await fetch(CEREBRAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await upstream.json().catch(() => null)
    if (!upstream.ok) {
      console.error('[cerebras] upstream error', upstream.status, data)
      return json({ error: 'Ошибка ИИ-сервиса', status: upstream.status, detail: data }, 502)
    }
    return json(data)
  } catch (e) {
    console.error('[cerebras] fetch failed', e)
    return json({ error: 'Не удалось связаться с ИИ-сервисом' }, 502)
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
