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
- SECURITY: личный GitHub-токен в `токен от github.txt` добавлен в `.gitignore` (+ `.env`).
- DEPLOY: запушено в `github.com/bognyfken/noenergydrink` (публичный). Vercel-проект
  `bognyfkens-projects/noenergydrink` создан и привязан к репо (авто-деплой при пуше),
  env Supabase заданы в проекте. Прод: **https://noenergydrink.vercel.app** (HTTP 200, публично).
- LESSON: Git на Windows падал на schannel TLS — лечится `git config http.sslBackend openssl`
  (задано в репо). Бывает transient `unexpected eof` — помогает повтор push.
- SMOKE (Playwright на проде): экран Сегодня (кнопка → серия), Календарь (цветные статусы,
  легенда, прямая ссылка /calendar), навигация — ОК. Данные в IndexedDB считаются верно (3/7/4
  на тестовых записях 13–20 июня). Playwright подключён к реальному Chrome пользователя.
- FIXED: склонение в мотивации («осталось N дня» вместо «осталсяось») — `lib/motivation.ts`.
- TODO (на пользователе): выполнить `supabase/schema.sql` в SQL Editor — таблиц пока нет
  (PostgREST 404 PGRST205), из-за чего облачный синк не активен (приложение живёт на Dexie).
- NOTE: Cerebras-ключ получен, отложен до этапа 3 (ИИ-помощник).
- DONE: облако Supabase настроено. `schema.sql` выполнен через Management API (PAT `sbp_`,
  сохранён в `токен от github.txt`, gitignored). Все 4 таблицы + RLS (`anon`) работают.
  E2E проверено: при открытии приложения локальные данные (8 дней 13–20 июня) и ачивки
  (d1, d3) автоматически залились в облако. Двусторонний синк рабочий.
- FIXED: back-fill ачивок в `hydrate` (раньше досылались только записи дней) — `lib/store.ts`.
- INFRA: т-н доступы пользователя в `токен от github.txt` (gitignored): GitHub PAT, Vercel,
  Cerebras, Supabase publishable/secret + Supabase PAT (`sbp_`). Management API Supabase и
  Vercel API из этой среды отвечают только через curl (Node fetch к api.* отваливается по таймауту).
- STATUS: этапы 0–1 завершены и в проде. Дальше — этап 2 (полировка) и этап 3 (ИИ).

## 2026-06-20 (вечер) — фидбек по скриншоту + регистрация
- FIXED (UI): шит редактирования был обрезан (не видно «Готово»/«Очистить») → `Sheet`
  теперь `max-h:90dvh` + скролл тела; проверено на ширине iPhone (390×844).
- FIXED: будущие даты нельзя отмечать (`MonthGrid`: `isFuture = key > today`, disabled).
- DESIGN: добавлен шрифт Comfortaa (`--font-display`) для заголовков и числа серии; убран
  временный логотип из шапки (ждём ассеты от пользователя — лого header + иконка сайта).
- DECISION (регистрация): профиль + код доступа (любой длины, не только 4 цифры).
  Приватность: данные профиля в облаке под секретным user_id (`did`), выводимым из кода
  (`auth.ts`: `deriveDid`), нигде не хранится. В `profiles` только salt+verifier для
  проверки кода. Ограничение: verifier читаем anon-ключом → короткий код перебираем
  оффлайн (для «случайно зашедших» защита полная; банковской нет — позже можно Supabase Auth).
- BUILD (auth): `AuthScreen` (выбор/создание профиля), гейт в `App`, `store.init/login/logout`,
  `setActiveUserId` в supabase, Dexie namespace по `did` (`openDb`), выход в настройках Today.
- SMOKE (Playwright на проде): создание профиля → вход → данные изолированы (новый профиль
  0/0/0, не видны чужие). Тестовый профиль и осиротевшие `default`-данные удалены; облако чистое.
- LESSON: установленный PWA/SW отдаёт старую версию из кеша до авто-обновления; при проверке
  пришлось снять SW + почистить cache. На устройствах обновится само (registerType autoUpdate).
- TODO: имя девушки — **Олеся** (для профиля и тёплых текстов/промпта ИИ).
- NEXT: чат с Qwen (Cerebras) + генерация мотивации (тёплый системный промпт); редизайн ачивок
  (больше целей, красивее, новые типы, тёплые тексты); вставить лого/иконку, когда пришлёт.
