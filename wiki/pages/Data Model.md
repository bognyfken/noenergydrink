# Data Model

**Last updated:** 2026-06-21

---

## Типы (`src/lib/types.ts`)
- `DayEntry { date: 'YYYY-MM-DD', status: 'clean'|'drank', note?, updatedAt }` — `unmarked` не хранится.
- `UnlockedAchievement { id, unlockedAt }`
- `ChatMessage { id, role, content, createdAt, conversationId?, toolResult? }` — сообщение чата с Кабанёнком.
- `Conversation { id, title, createdAt, updatedAt }` — беседа (история чатов).

## Хранилища
- **Dexie** (`lib/db.ts`), БД `net-energetikam-<did>` (namespace по профилю — данные профилей на одном
  устройстве не смешиваются): `entries` (pk date), `achievements` (pk id), `messages`, `meta`.
- **Supabase** (`supabase/schema.sql`): те же таблицы + колонка `user_id` (= секретный `did`), RLS `anon`.
  В `messages` добавлена колонка `conversation_id` (через Management API) — чтобы беседы переживали
  переустановку PWA.
- **`meta`** (key-value, JSON) — настройки/кеш помощника: `assistant_memory` (память об Олесе),
  `conversations` (список бесед), `warm` (кеш мотивации + быстрых ответов: current/next),
  `greeting_enabled` (тумблер приветствия). Синкается локально (Dexie) + облако (Supabase).
- **`profiles`** (вход по коду, `lib/auth.ts`): `id`, `name`, `salt`, `verifier` — для выбора профиля и
  проверки кода; сам код и `did` не хранятся (`did = sha256("did:"+id+":"+salt+":"+code)`).
- **`push_subscriptions`** (напоминания): `endpoint` (pk), `p256dh`, `auth`, `did`, `enabled`,
  `reminder_hour`. Пишется при включении тумблера; читается Vercel Cron для рассылки. См. [[Architecture]].

## Сессия/устройство (`src/lib/auth.ts`)
- `Session { profileId, name, did }` — в памяти (не сохраняется → код при каждом запуске).
- `DeviceProfile { id, name, salt, verifier }` — в `localStorage` (`ne_device_v1`), чтобы показать
  экран ввода кода без выбора профиля.

## Расчёт серии (`src/lib/streak.ts`, чистые функции, покрыты тестами)
- `computeCurrentStreak`: подряд `clean` до сегодня; если сегодня `unmarked` — считаем со вчера
  (серия не сбрасывается в полночь). `drank` и пропуск в середине рвут серию.
- `computeBestStreak`: самый длинный непрерывный отрезок `clean`.
- `computeTotalCleanDays`: все `clean`.

## Ачивки (`src/lib/achievements.ts`, чистые функции, покрыты тестами)
- **37 ачивок**, у каждой предикат `test(s: AchStats) => boolean` + `category` + опц. `goal`/`secret`.
- `AchStats` — богатая статистика из журнала (а не только серия): `best`, `totalClean`, `totalDrank`,
  `totalMarked`, `notes`, `comebacks`, `loggingStreak`, `cleanWeekends`, `fullCalendarWeeks`,
  `cleanMondays`, `bestMonthClean`, `fullCalendarMonth`, `distinctCleanMonths`, `cleanNewYear`,
  и секретные: `leapDayClean`, `friday13Clean`, `markedAtNight`, `postLapseStreak`, `phoenix`.
- `computeAchStats(entries)` собирает всё за один разбор; разбита на помощники
  `chronoSignals` (хронология: возвраты, серия учёта, серия-после-срыва, феникс) /
  `calendarSignals` (выходные, идеальные недели, понедельники, пасхалки) / `monthSignals` (по месяцам).
- `unlockedIds(stats)` → id открытых. `nextAchievement(streak)` → ближайшая по серии (для мотивации).
- ⚠️ `markedAtNight` опирается на `updatedAt` (время правки, не создания) — для пасхалки ок, но это
  не точный «момент отметки»; для честной метки нужен отдельный `createdAt`.
- Стор пересчитывает в `_reconcileAchievements` (`computeAchStats` → `unlockedIds`), новые id кладёт
  в `justUnlocked` для тоста. Открываются и задним числом по истории.

## Кабанёнок — чат, беседы, память
- **Сообщения** (`messages`): привязаны к беседе через `conversationId`. Старые без него мигрируют
  в одну беседу «Беседа» при загрузке (`_loadAssistant`). Модели уходит история только активной беседы.
- **Беседы**: хранятся как JSON-массив в `meta['conversations']` (а не отдельной таблицей). Мёрдж
  локального и облачного по `updatedAt`. Заголовок ставится из первого сообщения.
- **Память** (`lib/memory.ts`): `AssistantMemory { profile: string[], recent: string[], updatedAt }`.
  `profile` — стабильные факты, `recent` — хвост недавнего (лимит 15, дедуп). Пополняет сам Кабанёнок
  инструментом `remember`; при загрузке берётся более свежая версия (по `updatedAt`).
- **Тёплый контент** (`warm`): `{ motivation, quickReplies[3] }` для главного экрана. `current`
  показывается, `next` пред-генерится наперёд → при заходе мотивация новая.

## Даты (`src/lib/date.ts`)
Везде локальная зона, ключ `dateKey()` = 'YYYY-MM-DD' (чтобы «сегодня» совпадало с телефоном).

## See also
- [[Architecture]] · [[Features]]
