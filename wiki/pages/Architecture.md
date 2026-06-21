# Architecture

**Last updated:** 2026-06-21

---

## Стек
React 19 · TypeScript · Vite · Tailwind v4 (`@tailwindcss/vite`) · vite-plugin-pwa · Zustand ·
Dexie (IndexedDB) · Supabase · Framer Motion · date-fns · lucide-react · Manrope (`@fontsource`).
Хостинг — **Cloudflare Pages**. ИИ-помощник — **Cerebras** (модель `zai-glm-4.7`).

## ИИ-помощник «Кабанёнок» (`lib/ai.ts`, `lib/memory.ts`, `lib/assistant.ts`)
- **Прокси** `functions/api/chat.ts` (Cloudflare Pages Function): ключ `CEREBRAS_API_KEY` — только на
  сервере (env проекта Pages), в бандл не попадает. OpenAI-совместимый формат → Cerebras.
- **Клиент** `lib/ai.ts`: персона + `buildSystemPrompt` (контекст состояния + память), инструменты
  `set_day_status`/`add_day_note`/`remember`, `chat`/`chatAfterTools`, `generateWarmContent`
  (мотивация + 3 быстрых ответа одним JSON-вызовом). Модель `zai-glm-4.7` — «думающая» (reasoning в
  отдельном поле, в чат не течёт; лимиты токенов 2048, т.к. reasoning ест бюджет).
- **Память** `lib/memory.ts`: wiki-подобная (profile + recent, дедуп, лимит). **Контекст** `lib/assistant.ts`
  собирает её + последние дни. Tool-calls исполняются на клиенте (через стор), результаты — обратно модели.
- См. [[Features]] (UI: чат, история бесед, приветствие) · [[Data Model]] (типы, синк).

## Слой данных (local-first + облако)
- **Источник правды в рантайме** — Zustand-стор (`lib/store.ts`).
- Правки идут оптимистично в стор + Dexie (`lib/db.ts`, мгновенно, офлайн) и пушатся в Supabase
  (`lib/supabase.ts`). При старте `hydrate()` мёрджит локальное и облачное по `updatedAt` (last-write-wins).
- **Прогрессивное улучшение:** без `VITE_SUPABASE_*` клиент = null, приложение живёт на Dexie.
  Заданы env → включается синк.
- **Профили (вход по коду)** — `lib/auth.ts`: данные каждого профиля под секретным `did` (выводится из
  кода, нигде не хранится; в `profiles` только salt+verifier). Активный `did` → `user_id` облака
  (`setActiveUserId`) и namespace локальной базы (`openDb`). Профиль помнится на устройстве
  (`ne_device_v1`), код спрашивается при запуске (`LockScreen`). См. [[Data Model]].

## PWA
- `vite-plugin-pwa`, `registerType: autoUpdate`, офлайн-precache шелла.
- Манифест: name «Нет энергетикам», standalone, portrait, theme `#7c5cbf`, bg `#160f22`,
  иконки 192/512/512-maskable. iOS-мета-теги и `apple-touch-icon` в `index.html`.
- Safe-area (`env(safe-area-inset-*)`) + `100dvh` в `index.css` (`.app-shell`, `.bottom-tabs`).

## Напоминания (Web Push)
- На iOS пуши только в установленном PWA (экран «Домой», 16.4+). Подписка — `lib/push.ts`
  (`pushManager.subscribe`, VAPID public из `VITE_VAPID_PUBLIC`), хранится в Supabase `push_subscriptions`.
- Обработчики `push`/`notificationclick` — `public/push-sw.js`, вшиты в SW через `workbox.importScripts`.
- Рассылка — `api/cron-reminders.ts` через `web-push`; чистит мёртвые подписки (404/410).
- ⚠️ **Не мигрировано на Cloudflare:** крон был на **Vercel Cron**, а у Cloudflare Pages своего крона нет
  (нужен отдельный Worker с Cron Trigger). После переезда хостинга напоминания — открытый вопрос. См. [[Roadmap]].

## Структура
```
src/
  screens/      Today, Calendar, Achievements, Chat, Auth, Lock
  components/   nav/BottomTabBar; today/* (+GreetingCard); calendar/*; achievements/*; ui/Sheet;
                ReminderToggle; GreetingToggle; ConversationsSheet; ErrorBoundary; CanMark
  hooks/        useStreak, useToday
  lib/          types, date, plural, streak(+test), achievements(+test), motivation, db, supabase,
                store, auth, push, ai, memory, assistant
functions/      api/chat.ts (Cloudflare Pages Function — прокси Кабанёнка к Cerebras)
api/            chat.ts (legacy Vercel-вариант) · cron-reminders.ts (Web Push)
public/         logo.png, push-sw.js, _redirects (SPA-фолбэк), icons/*, achievements/*.webp
supabase/       schema.sql
.github/workflows/  deploy.yml (CI: build → wrangler pages deploy)
```

## Деплой
**Cloudflare Pages** (проект `noenergydrink`, https://noenergydrink.pages.dev). Авто-деплой через
**GitHub Actions** (`.github/workflows/deploy.yml`): push в `main` → `npm run build` → `wrangler pages deploy dist`.
Ушли с Vercel из-за `COMMIT_AUTHOR_REQUIRED` (Hobby блокировал деплои: автор коммитов не GitHub-юзер).
- Секреты CI (репо): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_SUPABASE_URL/ANON_KEY`,
  `VITE_APP_USER_ID`, `VITE_VAPID_PUBLIC`.
- Секрет Pages-функции: `CEREBRAS_API_KEY` (в настройках проекта Cloudflare, не в CI).
- Account Cloudflare `dac5848359ab4d74798b9d572259981e`; токен — env-переменная `CLOUDFLARE_API_TOKEN`.

## See also
- [[Data Model]] · [[Features]] · [[Roadmap]]
