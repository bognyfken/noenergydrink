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
  Заданы env → включается синк. Без экрана логина: один `USER_ID`.

## PWA
- `vite-plugin-pwa`, `registerType: autoUpdate`, офлайн-precache шелла.
- Манифест: name «Нет энергетикам», standalone, portrait, theme `#7c5cbf`, bg `#160f22`,
  иконки 192/512/512-maskable. iOS-мета-теги и `apple-touch-icon` в `index.html`.
- Safe-area (`env(safe-area-inset-*)`) + `100dvh` в `index.css` (`.app-shell`, `.bottom-tabs`).

## Структура
```
src/
  screens/      Today, Calendar, Achievements, Chat
  components/   nav/BottomTabBar; today/*; calendar/*; achievements/*; ui/Sheet; CanMark
  hooks/        useStreak
  lib/          types, date, plural, streak(+test), achievements, motivation, db, supabase, store
scripts/        icon-source.svg, gen-icons.mjs
supabase/       schema.sql
public/icons/   favicon.svg, apple-touch-icon.png, icon-192/512/512-maskable.png
```

## Деплой
Vercel (авто-HTTPS, serverless для ИИ-прокси на этапе 3). `npm run build` → `dist/`.

## See also
- [[Data Model]] · [[Features]] · [[Roadmap]]
