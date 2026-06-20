# Architecture

**Last updated:** 2026-06-20

---

## Стек
React 19 · TypeScript · Vite · Tailwind v4 (`@tailwindcss/vite`) · vite-plugin-pwa · Zustand ·
Dexie (IndexedDB) · Supabase · Framer Motion · date-fns · lucide-react · Manrope (`@fontsource`).

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
- Рассылка — **Vercel Cron** `api/cron-reminders.ts` (`vercel.json` crons `0 17 * * *` = 20:00 МСК, раз/день
  по лимиту Hobby) через `web-push`; VAPID private + subject в env Vercel; чистит мёртвые подписки (404/410).

## Структура
```
src/
  screens/      Today, Calendar, Achievements, Chat, Auth, Lock
  components/   nav/BottomTabBar; today/*; calendar/*; achievements/*; ui/Sheet; ReminderToggle; ErrorBoundary; CanMark
  hooks/        useStreak, useToday
  lib/          types, date, plural, streak(+test), achievements(+test), motivation, db, supabase, store, auth, push
api/            cron-reminders.ts (Vercel Cron, Web Push)
scripts/        icon-source.svg, gen-icons.mjs
supabase/       schema.sql
public/         logo.png, push-sw.js, icons/*, achievements/*.webp
```

## Деплой
Vercel (авто-HTTPS; serverless `api/*` + Cron). `npm run build` → `dist/`. Привязан к GitHub (авто-деплой).
Env (production): `VITE_SUPABASE_URL/ANON_KEY`, `VITE_VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT`.

## See also
- [[Data Model]] · [[Features]] · [[Roadmap]]
