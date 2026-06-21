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

## 2026-06-20 (вечер-2) — ассеты + ревью недочётов
- CREATED (assets): лого `public/logo.png` (банка в сердце, концепт C) → нарезан набор иконок
  PWA (`icon-192/512`, `icon-512-maskable` с safe-zone, `apple-touch-icon`); медали ачивок
  `public/achievements/d1…d100.webp` (нарезаны из ассета Gemini). Исходники Gemini убраны из
  деплоя в `wiki/sources/` (gitignored). Водяной знак Gemini на лого — на удаление.
- RESEARCH: разбор недочётов на этапе 2 → [[2026-06-20 разбор недочётов]]. Проверено на живом
  dev-сервере (Playwright, чистая загрузка) — стартует без ошибок в консоли; вчерашний
  `DatabaseClosedError` транзиентный (HMR + перезапуски по `.env`).
- LESSON: главные дыры не в ядре, а по краям — нет Error Boundary (сбой → белый экран),
  короткий код перебираем оффлайн (4 цифры = 10⁴), медали/лого готовы, но не подключены.
- NEXT (быстрые победы): медали в `AchievementsScreen`, лого на `AuthScreen`, Error Boundary.

## 2026-06-20 (вечер-3) — фидбек №2: лок-экран, редизайн, медали, лого
- FIXED (важное): календарный шит обрезался на iOS даже после max-h — корень в том, что
  `position: fixed` внутри скролл-контейнера на iOS Safari ведёт себя как absolute. Решение —
  рендер `Sheet` через `createPortal(document.body)`. Проверено на проде: «Очистить»/«Готово» видны.
- FEAT (вход): `LockScreen` — ввод кода как на iPhone (клавиатура, точки, shake при ошибке,
  «другой профиль»). Профиль помнится на устройстве (`ne_device_v1`), сессия/did в памяти —
  код спрашивается при каждом запуске. Выбор профиля больше не вылазит каждый раз.
- DESIGN (Today): убран блок из 3 цифр; число серии теперь ВНУТРИ огонька; пламя — два слоя
  (внешний/внутренний) с живым мерцанием; лого в шапке. Рекорд остаётся в Наградах,
  «всего без энергетика» перенесено в Календарь.
- FEAT (Награды): медали-картинки `public/achievements/<id>.webp` (закрытые — затемнённые + замок);
  больше целей (180/365), новые типы (всего 30/100 чистых, «Возвращение» после срыва),
  тёплые тексты. Логика открытия в `store._reconcileAchievements` (best/totalClean/comeback).
- FEAT: лого `public/logo.png` в шапке Today, на AuthScreen и LockScreen; `ErrorBoundary`
  (дружелюбная заглушка вместо белого экрана).
- SMOKE (Playwright, прод): создан тестовый профиль (код 29122024) → огонёк с «1» внутри →
  перезапуск показал ЛОК-ЭКРАН (не выбор профиля) → ввод кода разблокировал → шит календаря
  показывает все кнопки → медали отрисованы. Тестовый профиль и осиротевшие `default`/тест-данные
  удалены; в облаке остались только реальные данные «Кабаненок» (a2314673…, 18–20 июня + d1,d3).
- NOTE: параллельно вводится `src/hooks/useToday.ts` (реактивная дата) — правки MonthGrid/TodayScreen
  не мои, оставлены как WIP, не коммитил.
- NEXT: чат с Qwen + генерация мотивации (тёплый промпт), затем — арт для новых медалей (180/365/
  total/comeback), при желании — усилить защиту кода (Supabase Auth).

## 2026-06-20 (вечер-4) — авто-сброс дня в полночь
- FEAT (Today): `src/hooks/useToday.ts` — реактивный ключ «сегодня». Раньше `todayKey()`
  вычислялся один раз при рендере: если PWA висит открытым через полночь, экран показывал
  вчерашний день (кнопка не сбрасывалась). Теперь хук переключает дату в 00:00 локального
  времени (`setTimeout` до ближайшей полуночи +1с) и пересчитывает при возврате в приложение
  (`visibilitychange`/`focus` — фоновые таймеры на iOS душатся). Подключён в `TodayScreen`
  (вместо `todayKey()` + сид мотивации из `parseKey(today)`) и `MonthGrid` (подсветка today +
  блок будущих дат). Завершает WIP из вечер-3. Коммит `704a763`. `npm run build` зелёный.
- TODO: запушить `704a763` в `origin/main` → авто-деплой Vercel (на проде пока НЕТ).

## 2026-06-20 (вечер-5) — фидбек №3: свайп шита, кнопки статуса, чистое лого
- FIXED (Sheet): шит закрывался только тапом по фону, хотя «хваталка» намекала на свайп.
  Добавлен drag вниз через `useDragControls` — тянется ТОЛЬКО за хваталку (`dragControls.start`
  на её `onPointerDown`, `dragListener={false}`), чтобы не конфликтовать с прокруткой тела.
  Закрытие при `offset.y > 100` или `velocity.y > 500`. `src/components/ui/Sheet.tsx`.
- FIXED (DayEditorSheet): активная кнопка статуса («Без энергетика»/«Сорвалась») обрезалась у
  края — кольцо `ring-2` рисуется наружу, а `overflow-y-auto` шита клипает и по горизонтали.
  Решение: `ring-2 ring-inset` (рисуется внутрь) + `px-1` на скролл-контейнере шита.
- FIXED (логотип): `public/logo.png` имел серебристую рамку (белые полосы) и водяной знак Gemini.
  Центральный квадратный кроп 0.78 через sharp → 512×512, рамка/знак убраны; оригинал сохранён в
  `wiki/sources/logo-original.png` (gitignored). В шапке Today скругление `rounded-xl`→`rounded-2xl`
  (срезает остаточные дуги в углах). Коммит `db80f22`.
- ВАЖНО (процесс): над проектом одновременно работают ДВЕ Claude-сессии в ОДНОМ рабочем каталоге/репо.
  Параллельная ведёт расширение ачивок (`achievements.ts` с `computeAchStats` + категориями streak/
  total/comeback/calendar/logging/notes, `AchievementsScreen`, `store`, `motivation`, `achievements.test.ts`)
  — у неё это было НЕЗАКОММИЧЕНО в рабочем дереве. Я НЕ трогал эти файлы, коммитил точечно (только свои),
  чтобы не затереть. Git сериализует коммиты (её `09ed64a` встал, мой `db80f22` сверху — без конфликта).
  РЕКОМЕНДАЦИЯ: закрепить ачивки/медали за ОДНОЙ сессией, иначе риск гонок правок одних файлов.

## 2026-06-20 (вечер-6) — Кабанёнок: фундамент + движок (этап 3, подэтапы 1–2)
- DECISION: имя ИИ-помощника — **Кабанёнок** (семейная манера пары: кабан/кабаниха/кабанёнок,
  помощник — их «дитя»). Тон мягкий/тёплый, на «ты», женские местоимения, без осуждения срывов.
  Представляется «Привет, я Кабанёнок, твой персональный помощник», НИКОГДА не зовёт себя Qwen/
  нейросетью. Модель `qwen-3-235b-a22b-instruct`. Сохранено в память Claude (kabanenok-naming).
- DECISION (UX, по фидбеку): приветствие при открытии — ТОЛЬКО если сегодняшний день не отмечен;
  действия с днями из чата применяются СРАЗУ + плашка «отменить»; приветствие — карточка-оверлей
  на «Сегодня» с вопросом, 3 быстрыми ответами и полем ввода → после отправки переброс в «Помощник».
- DECISION: быстрые ответы и мотивацию на главном пишет САМ Кабанёнок (без стокового пула),
  всегда разные; пред-генерация наперёд на следующее открытие; один вызов отдаёт {motivation,
  quickReplies[3]}. Память помощника — wiki-подобная (стабильные факты + хвост недавнего).
- CREATED (code, подэтап 1): `api/chat.ts` (Vercel Edge-прокси к Cerebras, ключ CEREBRAS_API_KEY
  только на сервере, аллоулист полей); `src/lib/ai.ts` (персона PERSONA, `buildSystemPrompt` с
  контекстом+памятью, инструменты `set_day_status`/`add_day_note`/`remember`, `chat`/`chatAfterTools`,
  `generateWarmContent`). `.env.example` — описан CEREBRAS_API_KEY.
- CREATED (code, подэтап 2): `src/lib/memory.ts` (AssistantMemory: profile+recent, addToMemory с
  дедупом и лимитом 15, renderMemory); `src/lib/assistant.ts` (buildContext из записей+памяти,
  chatMessagesToAi); Dexie-хелперы `messages`/`meta` (`db.ts`); Supabase-синк `messages`/`meta`
  (`supabase.ts`); расширен `store.ts`: slice Кабанёнка — `sendMessage` (двойной round-trip с
  исполнением tool-calls на клиенте + `lastToolActions` для плашки), `appendNote` (merge заметки),
  `refreshWarmContent` (промоут пред-генерации + фоновая подготовка следующей), `setGreetingEnabled`,
  `undoLastToolActions`, `clearChat`, `_loadAssistant` (мёрдж сообщений/памяти/флагов из Dexie+облако).
- BUILD: `npm run build` зелёный (tsc -b + vite). UI (ChatScreen/GreetingCard/тумблер) НЕ трогал —
  это подэтапы 3–4, держим до синка с визуальной сессией (конфликт по TodayScreen/ChatScreen).
- ВНИМАНИЕ (процесс): я расширил `store.ts`, который параллельная сессия тоже правит (ачивки).
  Читал свежую версию перед каждым edit, строил поверх. Перед коммитом — проверить, что её правки
  стора на месте (computeAchStats и пр.), коммитить точечно.
- NEXT: подэтап 3 (ChatScreen UI) + подэтап 4 (GreetingCard + тумблер) по готовности визуала;
  затем `CEREBRAS_API_KEY` в Vercel и smoke. UI-этапы пока не начаты.
- ОТКРЫТО (по фидбеку, НЕ сделано мной — зона ачивок): медали «обгрызаны/убого» — нужен лучший рендер
  бейджей (крупнее, чистая круглая рамка) и/или арт; это в файлах параллельной сессии.
- NEXT: чат с Qwen + генерация мотивации (тёплый промпт, обращение по имени, tool-calling заметок);
  довести медали; арт `d21/d90/d180/d365/total*/comeback/...` в `public/achievements/`.

## 2026-06-20 (вечер-6) — ачивки: 32 обычных + 5 секретных, движок на предикатах
- UPDATED (ачивки): расширены с 12 до **37**. Раньше зависели от 3 сигналов (`best`/`totalClean`/
  `comeback`) — теперь у каждой предикат `test(s: AchStats)` + `category` (`streak`/`total`/`comeback`/
  `calendar`/`logging`/`notes`). Новые сигналы в `AchStats` (14+5): выходные, идеальные недели/месяцы,
  понедельники, охват месяцев, серия учёта, заметки, новый год и др. `src/lib/achievements.ts`,
  `store._reconcileAchievements` (через `computeAchStats`), `AchievementsScreen` (иконки по категориям),
  `motivation` (guard под опц. `goal`). См. [[Data Model]] · [[Features]].
- CREATED (секретные, 5): скрыты как «???» до открытия (флаг `secret`), тост — «Секретная награда» + ✨.
  Високосный (29 фев) · Пятница 13 · Полуночница (`updatedAt` 00:00–04:59) · Второе дыхание (серия 14+
  после срыва) · **Феникс** (вернуться после 3+ срывов подряд). Изначально был «Полный круг» (7 дней
  недели) — по фидбеку заменён на Феникс как менее дублирующий.
- DECISION: `computeAchStats` разбита на `chronoSignals`/`calendarSignals`/`monthSignals` (когнитивная
  сложность). Покрыто `achievements.test.ts` — **26 тестов** зелёные, `tsc -b` чистый.
- LESSON: `markedAtNight` опирается на `updatedAt` (время правки, не создания). Для одноразовой пасхалки
  ок (награда не снимается), но для честной метки времени отметки нужен отдельный `createdAt`.
- CREATED: `queries/2026-06-20 промты Nano Banana для бейджей` — базовый стиль + промт на каждый из 37
  бейджей (claymorphism-монета, палитра проекта). Под арт в `public/achievements/<id>.webp`.
- NEXT: сгенерить арт по промтам → выставить `hasImage: true`; обдумать `createdAt` для честной ночной отметки.

## 2026-06-20 (вечер-7) — ежедневные пуш-напоминания (Web Push)
- РАСПРЕДЕЛЕНИЕ: 4 сессии. Эта взяла **напоминания** (другие: чат Qwen / лого+ачивки / новые ачивки).
- DECISION: на iOS веб-напоминания, когда приложение закрыто, возможны ТОЛЬКО через Web Push и ТОЛЬКО
  для установленного PWA (на экран «Домой», iOS 16.4+). Значит нужен серверный отправитель.
- BUILD: VAPID-ключи (public → клиент, private → env Vercel, оба в gitignored `токен от github.txt`).
  Таблица `push_subscriptions` (endpoint pk, p256dh, auth, did, enabled, reminder_hour) + RLS anon.
  `src/lib/push.ts` (subscribe/unsubscribe/getPushState — состояния unsupported/needs-install/denied/on/off).
  `public/push-sw.js` (push/notificationclick) подключён в SW через `workbox.importScripts` (vite.config).
  `ReminderToggle` в настройках Today. `api/cron-reminders.ts` + `vercel.json` crons `0 17 * * *`
  (=20:00 МСК, раз в день — совместимо с Hobby), шлёт через `web-push`, чистит мёртвые (404/410).
- ENV Vercel (production): `VITE_VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT` (mailto). Cron читает
  Supabase через уже заданные `VITE_SUPABASE_URL`/`ANON_KEY`. Коммит `32f66f2`.
- SMOKE (прод): `GET /api/cron-reminders` → `{"ok":true,"total":0,"sent":0,"pruned":0}` — функция жива,
  env читаются, таблица опрашивается, web-push инициализируется. Тумблер «Напоминания» в настройках
  рендерится (состояние off). Тестовый профиль ТестПуш создан/удалён; в облаке только «Кабаненок».
- ОГРАНИЧЕНИЕ: реальную доставку пуша автоматизацией не проверить (системный запрос разрешения).
  Проверять на установленном PWA на айфоне: вкл. тумблер → разрешить уведомления → дождаться 20:00 МСК
  (или дёрнуть `/api/cron-reminders` вручную) → должно прийти уведомление.
- NOTE: cron-эндпоинт сейчас открыт (без `CRON_SECRET`) — дёрнуть может кто угодно (вред минимальный:
  внеплановое «отметь день»). При желании задать `CRON_SECRET` в env Vercel (он сам шлёт Bearer).
- LESSON: SPA-rewrite в `vercel.json` надо исключать `api/` (иначе `/api/*` уходит в index.html);
  добавил `api/|` в негативный lookahead. На Hobby cron — не чаще раза в день, поэтому фикс. время 20:00 МСК.

## 2026-06-20 (вечер-8) — Кабанёнок: UI в изолированном worktree (подэтапы 3–5)
- WORKTREE: UI собран в отдельном git-worktree `../NoEnergyDrink-kabanenok` на ветке
  **`feat/kabanenok`** (от HEAD `8abe200`), чтобы не гонять правки `TodayScreen`/`ChatScreen`
  с визуальными сессиями. `node_modules` — junction на основной. Коммит **`e4b25b3`** (12 файлов,
  +1233). НЕ запушено, НЕ смёржено — по просьбе мерджим позже.
- РЕКОНСТРУКЦИЯ движка на чистом HEAD: в worktree HEAD-`store.ts` отличался от рабочего дерева
  основной сессии (там незакоммиченная WIP ачивок с `computeAchStats`). Мои правки легли на
  чистый baseline (с `computeBestStreak`), без чужой WIP → ветка самодостаточна и чисто мёржится.
- CREATED (UI): настоящий `ChatScreen` (пузыри user/assistant, ввод, плашка «отменить» с
  `lastToolActions`, индикатор «печатает», мягкие ошибки, авто-отправка реплики из приветствия
  через `location.state.send`); `components/today/GreetingCard` (оверлей-шит на «Сегодня`:
  вопрос Кабанёнка + 3 быстрых ответа из `warm.quickReplies` + поле ввода → `navigate('/chat')`);
  `components/GreetingToggle` (тумблер «Кабанёнок встречает», в шите профиля); интеграция в
  `TodayScreen` (мотивация из `warm.motivation` с запасной `motivationFor`, `refreshWarmContent`
  по `hydrated`, показ приветствия только при неотмеченном дне + guard `sessionStorage kab_greeted_<date>`).
- BUILD: `npm run build` в worktree зелёный (3078 модулей).
- СОСТОЯНИЕ МЕРДЖА (важно): движок (подэтапы 1–2) лежит ОДНОВРЕМЕННО в рабочем дереве основной
  сессии (незакоммичен, вперемешку с ачивками) И в `feat/kabanenok` (закоммичен, чисто). UI — только
  на ветке. План интеграции: т.к. движок уже есть в main, «мердж» = принести UI-файлы
  (`ChatScreen`, `GreetingCard`, `GreetingToggle`, интеграция `TodayScreen`) — первые три drop-in,
  `TodayScreen` свести с визуальной сессией. Альтернатива — git-merge ветки с ручным разрешением `store.ts`.
- TODO (деплой, до прода): `CEREBRAS_API_KEY` в env Vercel (ключ в `токен от github.txt`); smoke чата.

## 2026-06-21 — ачивки: арт-промты и синк вики
- CREATED: `queries/2026-06-20 промты Nano Banana для бейджей` — базовый стиль (claymorphism-монета,
  палитра проекта, кант растёт по рангу) + промт на каждый из 37 бейджей. Под арт `public/achievements/<id>.webp`.
- UPDATED (по факту правок в рабочем дереве): дисплей [[Features|Наград]] временно на **эмодзи** (карта
  `EMOJI` по id в `AchievementsScreen`), а не иконки lucide; закрытые приглушены + замок, секрет — «❓».
  У всех 37 ачивок `hasImage: true` (готово под арт; есть 7 webp: `d1 d3 d7 d14 d30 d60 d100`).
- ⚠️ Расхождение: пока экран рисует эмодзи (картинки игнорируются), 404 нет; при возврате к `<img>`
  недостающие 30 `webp` дадут 404 — нужно сгенерить арт ИЛИ оставить эмодзи как фолбэк.
- SYNC: обновлены [[Features]] (дисплей наград + арт), [[Design]] (стиль бейджей + ссылка на промты),
  [[Data Model]] (`AchStats`/`computeAchStats`). Движок ачивок (37, предикаты, секретные, 26 тестов) —
  из записи «вечер-6».
- NEXT: сгенерить 30 арт-бейджей по промтам → вернуть `<img>` (или гибрид эмодзи+арт).

## 2026-06-21 (ночь) — безопасность, свод сессий, деплой
- SECURITY (по запросу): репозиторий → private (GitHub API). Аудит: git-история чистая,
  в публичном прод-бандле НЕТ серверных секретов (csk-/sb_secret_/приватный VAPID) — только
  публичные VITE_*. Полный разбор — [[2026-06-20 безопасность — аудит и план]].
- SECURITY (главное): закрытие репо НЕ закрывает основную дыру — anon-ключ в публичном бандле +
  открытая RLS → читаемы все заметки, перебираем код (salt/verifier), можно стереть данные.
  Лечит только Supabase Auth + RLS по auth.uid() (рефактор supabase.ts/auth.ts/store.ts — зона
  чат-сессии; нужна координация). Решение за пользователем.
- SECURITY: cron закрыт — CRON_SECRET в env Vercel.
- MERGE («мерджи с тем что есть»): свёл всю незакоммиченную работу сессий в коммит aebaafd —
  чат Кабанёнка (api/chat, lib/ai/assistant/memory, ChatScreen, GreetingCard/Toggle, TodayScreen),
  арт медалей public/achievements/*.webp, правки achievements/store/supabase/db/motivation,
  иконки/лого, скрипты нарезки, вики.
- FIXED (важное): сборка/деплой падали из-за мусорного public/Image.png (2.39 МБ > лимита
  PWA-precache). Убран в wiki/sources/ (gitignored); в .gitignore добавлены __pycache__/,
  *.tsbuildinfo (снят с трекинга). После этого npm run build зелёный.
- ENV Vercel: задан CEREBRAS_API_KEY (прокси чата) + ранее VAPID_*, CRON_SECRET.
- DEPLOY: авто-деплой перестал обновлять прод (git-деплой завис UNKNOWN — вероятно, доступ Vercel
  GitHub App сбился после перевода репо в private). Форс прод-деплоя через vercel CLI. Проверка cron→401.
- TODO/РИСК: восстановить авто-деплой из приватного репо (Vercel GitHub App), иначе релизы вручную.

## 2026-06-21 — мердж UI Кабанёнка в main + статус деплоя
- MERGE: UI Кабанёнка влит в `main` коммитом **`f3469ad`** (push: `aebaafd..f3469ad`). По факту
  (`git cat-file`) в `aebaafd` UI НЕ было (только движок + стаб ChatScreen) — несмотря на запись
  в логе свода. `f3469ad` добавил недостающее: настоящий `ChatScreen`, `GreetingCard`,
  `GreetingToggle`, интеграцию `TodayScreen`. Чужую незакоммиченную WIP (арт, achievements.ts,
  AchievementsScreen) НЕ трогал — коммитил только свои 4 файла. `npm run build` зелёный.
- DEPLOY (заблокирован, как и у свода): git-push дал деплой `f3469ad` в статусе **BLOCKED**
  (из 20 последних: 15 READY older, 5 BLOCKED recent). Корень — тот же: репо private → Vercel
  GitHub App без доступа к исходникам → сборка не идёт. Прод сейчас отдаёт старый READY-билд
  БЕЗ `api/chat` (`/api/chat` → 404), UI Кабанёнка на прод НЕ выкачен.
- ENV: `CEREBRAS_API_KEY` подтверждён в env Vercel (encrypted, prod+preview+dev) — готов к билду.
- ЧИНИТЬ ДЕПЛОЙ: либо восстановить Vercel GitHub App для приватного репо (дашборд, на пользователе),
  либо форс прод-деплой через `vercel CLI` — но он зальёт ТЕКУЩЕЕ рабочее дерево (с чужой WIP),
  поэтому в одиночку не делал: при 4 активных сессиях это решение пользователя/координации.

## 2026-06-21 — переезд хостинга на Cloudflare Pages + модель Кабанёнка
- DECISION: ушли с Vercel. Причина — Vercel блокировал ВСЕ прод-деплои: `COMMIT_AUTHOR_REQUIRED`
  (автор коммитов `hoholocoste@gmail.com` — не GitHub-юзер; владелец Vercel/репо — `bognyfken`).
  Анти-абьюз Hobby. Переехали на **Cloudflare Pages** (там такого ограничения нет).
- DEPLOY (Cloudflare): проект Pages **`noenergydrink`** (account `dac5848359ab4d74798b9d572259981e`,
  токен в env `CLOUDFLARE_API_TOKEN` — он же у manicure). Деплой — **direct upload через wrangler**
  (`wrangler pages deploy dist`, не git-connect). Прод: **https://noenergydrink.pages.dev** — ЖИВ.
  - `functions/api/chat.ts` — прокси чата в формате Pages Functions (env вместо process.env).
  - `public/_redirects` (`/* /index.html 200`) — SPA-фолбэк; Functions матчатся раньше.
  - Секрет `CEREBRAS_API_KEY` задан в проекте Pages (production).
- MODEL: на аккаунте Cerebras Qwen НЕ включён — доступны только `zai-glm-4.7` и `gpt-oss-120b`.
  Выбран **`zai-glm-4.7`** (самый тёплый русский тон + tool-calling; gpt-oss отдаёт пустой content).
  Обе — «думающие»: reasoning в отдельном поле `message.reasoning` (в чат не течёт), но ест токены.
  Подняты лимиты: `generateWarmContent` 400→2048, прокси-дефолт 1024→2048 (иначе JSON/контент режется).
- GROK (xAI): пробовали — ключ валиден (сохранён в `токен от github.txt` как `grok:`), но команда
  без кредитов → `permission-denied`. Нужно активировать кредиты/data-sharing в console.x.ai. Отложено.
- ⚠️ ВНИМАНИЕ сессии НАПОМИНАНИЙ: Web Push cron (`api/cron-reminders.ts` + Vercel Cron) на Cloudflare
  Pages НЕ работает (нет Pages-крона). Если полностью уходим с Vercel — напоминания надо вынести
  в отдельный Cloudflare Worker с Cron Trigger, либо оставить этот кусок на Vercel. Решить отдельно.
- ОСТАЛОСЬ: (1) перевести установленный PWA Олеси с vercel.app на pages.dev (кастомный домен или
  переустановить с нового URL); (2) e2e-smoke живого приложения; (3) авто-деплой CF (git-connect в
  дашборде) вместо ручного wrangler; (4) судьба напоминаний; (5) опц. снести Vercel-проект.
- ПОПРАВКА (проверено): прод ВЫЕХАЛ. CLI-деплой `rfg7b0wt7` стал прод; cron=401 без секрета / 200 с
  секретом; `/api/chat` отвечает 400 «Нужно поле messages» (функция жива); сайт 200. Статусы UNKNOWN
  и «socket hang up» в `vercel ls/inspect` — артефакт нестабильной связи этой среды с api.vercel.com,
  а НЕ лимит/поломка авто-деплоя. Свод сессий + CRON_SECRET + CEREBRAS_API_KEY — в проде.

## 2026-06-21 — ассеты (лого + медали) и ОТКАТ ачивок на эмодзи
- LOGO: финальный логотип из прозрачного исходника (`wiki/sources/logo-original.png` /
  `Image.png` и др.) → `public/logo.png` 512², отцентрован, без вотермарка/рамки; иконки PWA
  перегенерены из него (`icon-192/512`, `apple-touch`, `maskable` с safe-zone). Долгий путь:
  пробовали кропать кривой 512-исходник — отказались, взяли чистый прозрачный от пользователя.
- MEDALS (пайплайн): [scripts/slice_sheet.py](../../scripts/slice_sheet.py) — нарезает ОДИН
  лист со всеми 37 медалями в отдельные круглые webp. Сам определяет фон: **прозрачность /
  белый / шахматка / зелёный хромакей**. Финальный алгоритм круга: distance-transform →
  **вписанная окружность** (центр+радиус диска), радиус = `INNER_FACTOR`(0.86)×медиана ряда,
  но не больше своего безопасного (иначе альфа режет в плоскую грань). Порядок медалей зашит
  построчно = порядку `ACHIEVEMENTS` (ряды 11/6/10/5/5). Исходники листов — `wiki/sources/`.
  Доп. скрипт [scripts/process_medals.py](../../scripts/process_medals.py) — для отдельных файлов.
- LESSON (медали): «запечённые» фоны Gemini (шахматка = НЕ прозрачность, фейк) и 3D-кнопки
  с тенью/основанием → края кропа кривые. Решение, что сработало: **зелёный хромакей или
  настоящая альфа** в исходнике + рез по ВНУТРЕННЕМУ кругу. Замер ровности — по разбросу
  радиуса контура (готовые файлы: <1px, идеальный круг). «Кривизна» у пользователя в превью —
  это шахматка-прозрачность просмотрщика, не пиксели файла.
- DECISION (важно): **ачивки временно показывают ЭМОДЗИ, не картинки.** Пользователь устал
  от итераций по медалям → откатили отображение на эмодзи «как изначально». `AchievementsScreen.tsx`
  переписан: своя `EMOJI`-карта на 37 id, закрытые — тускло+замок, секретные — `❓`/«???».
  webp НЕ удалены (лежат в `public/achievements/`), `achievementImage()` оставлен — вернёмся позже.
  ⚠️ Это расходится с описанием в [[Design]] (раздел «Бейджи наград») — там про webp-медали.
- CACHE: добавлен `MEDAL_ASSET_VERSION` + `?v=` к ссылкам медалей (`achievements.ts`) — чтобы
  браузер/PWA не отдавал старые закэшированные картинки при перегенерации (на будущее, когда
  вернём арт; сейчас не задействовано, т.к. эмодзи).
- MERGE-NOTE: правки в общих файлах `src/screens/AchievementsScreen.tsx` (полностью переписан на
  эмодзи) и `src/lib/achievements.ts` (`hasImage:true` у всех, версия ассетов). При слиянии с
  веткой Кабанёнка возможен конфликт именно в этих двух файлах — выбирать осознанно.
- TODO (доделать арт-ачивки потом): (1) решить эмодзи vs медали-картинки; (2) если медали —
  переключить экран обратно на `achievementImage()`, поднять `MEDAL_ASSET_VERSION`; (3) обновить
  [[Design]] под итоговый вариант.

## 2026-06-21 (продолжение) — авто-деплой, история чатов, фиксы (Кабанёнок-сессия)
- MODEL (итог): Кабанёнок на **`zai-glm-4.7`** (Cerebras). Qwen на аккаунте недоступен (в `/v1/models`
  только `zai-glm-4.7` и `gpt-oss-120b`). GLM — самый тёплый русский тон + tool-calling; gpt-oss отдаёт
  пустой content. GLM «думающая» (reasoning ~660 токенов в отдельном поле, отключить нельзя — проверены
  `reasoning_effort`/`/nothink`/`chat_template_kwargs`). Лимиты подняты до 2048.
- GROK (xAI): ключ валиден (сохранён `grok:` в `токен от github.txt`), но команда без кредитов →
  `permission-denied`. Отложено до активации в console.x.ai (team `4984bab2…`).
- DEPLOY: **авто-деплой через GitHub Actions** (`.github/workflows/deploy.yml`): push в main → build
  (VITE_* из секретов репо) → `wrangler pages deploy dist`. Секреты заданы через `gh secret set`
  (CLOUDFLARE_API_TOKEN/ACCOUNT_ID + 4 VITE_*). Проверено: несколько прогонов success (~40с). Ручной
  wrangler больше не нужен. CEREBRAS_API_KEY — секрет проекта Pages (не CI).
- FEAT (история чатов): беседы Кабанёнка. `Conversation{id,title,createdAt,updatedAt}` + `conversationId`
  у сообщений. Стор: `newConversation/switchConversation/renameConversation/deleteConversation`, модели
  уходит история только активной беседы, миграция старых сообщений без id в одну беседу. Синк:
  `conversation_id` добавлен в `public.messages` (Management API ALTER), список бесед в `meta['conversations']`.
  UI: `ConversationsSheet` (список/новый/переименование/удаление) + шапка `ChatScreen`.
- FIXED (мотивация не менялась при обновлении): причина — `generateWarmContent` падал на лимите 400
  (reasoning съедал бюджет → пустой JSON → показывалась статичная `motivationFor`). Лимит → 2048, теперь
  warm-content генерится и меняется при заходе. Проверено на проде (валидный JSON: motivation + 3 ответа).
- PERF (опрос долго думал): убран лишний второй round-trip в `sendMessage` — GLM часто отдаёт текст
  вместе с tool-call, тогда `chatAfterTools` не вызывается. Ежедневный опрос ~вдвое быстрее (~1.7с vs ~3.5с).
- DECISION (ачивки): пользователь подтвердил — **финально ЭМОДЗИ**, не картинки. Закоммичена эмодзи-версия
  `AchievementsScreen` (HEAD = эмодзи → деплоится). 37 перегенерированных `.webp` остались незакоммичены
  (с эмодзи не нужны). Прод теперь показывает эмодзи.
- LESSON: `rm -rf` по папке worktree с junction на `node_modules` снёс `.bin`-шимы главного проекта
  (`tsc`/`vite` not found). Лечится `npm install`. Впредь junction-worktree удалять только `git worktree
  remove` (а если падает — сначала убрать junction, потом папку).
- STATUS: Кабанёнок полностью на проде (чат, история, приветствие, мотивация, память) — https://noenergydrink.pages.dev.
  Открыто: напоминания (Vercel-крон не переехал), Grok (нет кредитов), при желании — кастомный домен, арт-медали.
