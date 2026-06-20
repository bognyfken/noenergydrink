# CLAUDE.md — Нет энергетикам

PWA-трекер дней без энергетиков для iPhone (Safari → «На экран Домой», без App Store).
Сделан для конкретного человека (медицинские показания). Тон UI — тёплый, поддерживающий,
без осуждения срывов. Язык интерфейса — **русский**.

## Стек
React 19 · TS · Vite · Tailwind v4 · vite-plugin-pwa · Zustand · Dexie · Supabase ·
Framer Motion · date-fns. Подробнее — [[Architecture]].

## Команды
- `npm run dev` — дев-сервер (+ LAN для теста с iPhone)
- `npm run build` — typecheck + сборка + service worker
- `npm test` — юнит-тесты логики серии
- `node scripts/gen-icons.mjs` — перегенерировать иконки PWA

## Архитектура данных (кратко)
Zustand-стор — источник правды; правки → Dexie (офлайн) + Supabase (облако, last-write-wins).
Без `VITE_SUPABASE_*` работает локально. Без логина, один `USER_ID`. См. [[Data Model]].

## Project Wiki — `wiki/`
**Постоянная память между сессиями.** В начале нетривиальной сессии прочитать `wiki/index.md`
и хвост `wiki/log.md`. Формат и воркфлоу — `wiki/SCHEMA.md`.
- `wiki/pages/` — страницы (Overview, Features, Architecture, Data Model, Design, Roadmap)
- `wiki/queries/` — сохранённые разборы
- `wiki/sources/` — сырьё (**gitignored**, локально)
- После значимых изменений — обновлять страницы + дописывать `wiki/log.md` (action + хеш коммита).

## Безопасность
- `токен от github.txt` — личный GitHub-токен пользователя. **Не открывать без нужды, не печатать,
  не коммитить.** В `.gitignore`. `.env` — тоже игнорируется.
- Ключи API (Supabase server-side, Cerebras на этапе 3) — только через серверные env, не в бандл.

## Статус
Этапы 0–1 готовы (ядро трекера). Дальше — деплой на Vercel, настройка Supabase, затем
ИИ-помощник (этап 3, Qwen/Cerebras, function calling). См. [[Roadmap]].
