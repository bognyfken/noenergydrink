# Wiki Log

## 2026-06-20
- INIT: Создана структура вики (SCHEMA, index, log, pages, templates, sources, queries).
- DECISION: Приложение — PWA для iPhone (Safari → «На экран Домой»), без App Store.
  Цель: трекер дней без энергетиков для конкретного пользователя (медицинские показания).
- DECISION: Название — «Нет энергетикам».
- DECISION: Хранение — облако Supabase + локальный кеш Dexie (local-first, без экрана логина,
  один user_id). Приложение работает и без облака, синк включается при заданных env.
- DECISION: ИИ-помощник (Qwen через Cerebras, function calling для записи заметок) — этап 3,
  отложен. Сначала ядро трекера.
- CREATED (code): Этап 0 — каркас Vite+React 19+TS+Tailwind v4+vite-plugin-pwa; app-shell с
  safe-area и нижним таб-баром; слой данных (типы, Dexie, Zustand-стор, Supabase-клиент со sync).
- CREATED (code): Этап 1 — экраны Сегодня (огонёк-серия, кнопка, статистика, мотивация),
  Календарь (месячный грид + шит редактирования: статус + заметка), Награды (ачивки),
  Помощник (заглушка под этап 3). Тост ачивок.
- CREATED (code): `streak.ts` (чистые функции серии) + тесты Vitest (8 passed).
- CREATED (code): иконки PWA из `scripts/icon-source.svg` через sharp; мотив перечёркнутой банки.
- LESSON: на Windows/PowerShell native-команды (node/npm) пишут в stderr — PowerShell оборачивает
  это в NativeCommandError, но это НЕ ошибка сборки. Сборка прошла (`✓ built`), тесты зелёные.
- CREATED: [[Overview]], [[Features]], [[Architecture]], [[Data Model]], [[Design]], [[Roadmap]].
- SECURITY: личный GitHub-токen в `токен от github.txt` добавлен в `.gitignore` (+ `.env`).
