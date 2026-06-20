// Лёгкая авторизация по коду (без email). У каждого профиля свой код доступа.
//
// На устройстве запоминается ТОЛЬКО профиль (id, name, salt, verifier) — этого
// хватает, чтобы при запуске показать красивый ввод кода (как на iPhone) без
// выбора профиля и проверить код офлайн. Сам код и секретный user_id (did) НЕ
// хранятся: did выводится из кода при каждом входе.
//
// Приватность: данные профиля в облаке лежат под did, выводимым из кода, и нигде
// не хранятся. verifier читаем anon-ключом → короткий код перебираем оффлайн
// (для «случайно зашедших» защита полная; банковской нет — позже Supabase Auth).

const DEVICE_KEY = 'ne_device_v1'

export interface Session {
  profileId: string
  name: string
  did: string // секретный user_id для данных (в памяти, не сохраняется)
}

/** Профиль, запомненный на этом устройстве (для экрана ввода кода). */
export interface DeviceProfile {
  id: string
  name: string
  salt: string
  verifier: string
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

/** verifier — для проверки правильности кода. */
export function makeVerifier(salt: string, code: string): Promise<string> {
  return sha256hex(`verify:${salt}:${code}`)
}

/** did — секретный user_id данных. Выводится из кода, нигде не хранится. */
export function deriveDid(profileId: string, salt: string, code: string): Promise<string> {
  return sha256hex(`did:${profileId}:${salt}:${code}`)
}

// ── Профиль устройства (localStorage) ─────────────────────────────────────

export function getDeviceProfile(): DeviceProfile | null {
  try {
    const raw = localStorage.getItem(DEVICE_KEY)
    return raw ? (JSON.parse(raw) as DeviceProfile) : null
  } catch {
    return null
  }
}

export function setDeviceProfile(p: DeviceProfile): void {
  localStorage.setItem(DEVICE_KEY, JSON.stringify(p))
}

export function clearDeviceProfile(): void {
  localStorage.removeItem(DEVICE_KEY)
}

export const MIN_CODE_LENGTH = 4
