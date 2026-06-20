# Data Model

**Last updated:** 2026-06-20

---

## Типы (`src/lib/types.ts`)
- `DayEntry { date: 'YYYY-MM-DD', status: 'clean'|'drank', note?, updatedAt }` — `unmarked` не хранится.
- `UnlockedAchievement { id, unlockedAt }`
- `ChatMessage { id, role, content, createdAt, toolResult? }` — для этапа 3.

## Хранилища
- **Dexie** (`lib/db.ts`), БД `net-energetikam`: `entries` (pk date), `achievements` (pk id),
  `messages`, `meta`.
- **Supabase** (`supabase/schema.sql`): те же таблицы + колонка `user_id`, RLS с политикой для `anon`.

## Расчёт серии (`src/lib/streak.ts`, чистые функции, покрыты тестами)
- `computeCurrentStreak`: подряд `clean` до сегодня; если сегодня `unmarked` — считаем со вчера
  (серия не сбрасывается в полночь). `drank` и пропуск в середине рвут серию.
- `computeBestStreak`: самый длинный непрерывный отрезок `clean`.
- `computeTotalCleanDays`: все `clean`.

## Ачивки (`src/lib/achievements.ts`)
Майлстоуны 1/3/7/14/30/60/100. `unlockedIdsForStreak(best)` → какие открыты.
Стор пересчитывает в `_reconcileAchievements`, новые кладёт в `justUnlocked` для тоста.

## Даты (`src/lib/date.ts`)
Везде локальная зона, ключ `dateKey()` = 'YYYY-MM-DD' (чтобы «сегодня» совпадало с телефоном).

## See also
- [[Architecture]] · [[Features]]
