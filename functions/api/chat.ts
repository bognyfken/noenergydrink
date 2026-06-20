// Cloudflare Pages Function — прокси к Cerebras (Qwen) для ИИ-помощника «Кабанёнок».
// Маршрут: POST /api/chat. Ключ CEREBRAS_API_KEY берётся из env проекта Pages
// (Settings → Environment variables), в браузерный бандл не попадает.
//
// Аналог прежней Vercel-функции `api/chat.ts`, переписанный под Workers-рантайм
// (env вместо process.env; нет `export const config`).

interface Env {
  CEREBRAS_API_KEY?: string
}

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

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const onRequestPost = async (ctx: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = ctx
  const key = env.CEREBRAS_API_KEY
  if (!key) return json({ error: 'CEREBRAS_API_KEY не задан на сервере' }, 500)

  let body: ChatBody
  try {
    body = (await request.json()) as ChatBody
  } catch {
    return json({ error: 'Некорректный JSON в теле запроса' }, 400)
  }
  if (!Array.isArray(body.messages)) {
    return json({ error: 'Нужно поле messages (массив)' }, 400)
  }

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
      return json({ error: 'Ошибка ИИ-сервиса', status: upstream.status, detail: data }, 502)
    }
    return json(data)
  } catch {
    return json({ error: 'Не удалось связаться с ИИ-сервисом' }, 502)
  }
}

// Любой не-POST метод на /api/chat → 405.
export const onRequest = async (): Promise<Response> => json({ error: 'Только POST' }, 405)
