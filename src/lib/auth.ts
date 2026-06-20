// Лёгкая авторизация по коду (без email). У каждого профиля свой код доступа.
//
// Приватность: данные пользователя в облаке лежат под секретным user_id (did),
// который ВЫВОДИТСЯ из кода и нигде не хранится. В таблице profiles хранится только
// salt + verifier (для проверки кода на клиенте). Без кода нельзя ни пройти проверку,
// ни вычислить did → данные не подсмотреть даже через API.
//
// Ограничение: verifier читаем через anon-ключ, поэтому короткий код теоретически
// перебираем оффлайн. Для «случайно зашедших» защита полная; банковской — нет.

const SESSION_KEY = 'ne_session_v1'

export interface Session {
  profileId: string
  name: string
  did: string // секретный user_id для данных
}

// ── Web Crypto helpers ────────────────────────────────────────────────────

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomToken(bytes = 16): string {
  const a = new Uint8Array(bytes)
  crypto.getRandomValues(a)
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** verifier — для проверки правильности кода (хранится в profiles). */
export function makeVerifier(salt: string, code: string): Promise<string> {
  return sha256hex(`verify:${salt}:${code}`)
}

/** did — секретный user_id данных. Выводится из кода, нигде не хранится. */
export function deriveDid(profileId: string, salt: string, code: string): Promise<string> {
  return sha256hex(`did:${profileId}:${salt}:${code}`)
}

// ── Сессия (localStorage) ─────────────────────────────────────────────────

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function setSession(s: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

export const MIN_CODE_LENGTH = 4
