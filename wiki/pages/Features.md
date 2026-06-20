# Features

**Last updated:** 2026-06-20

---

Нижний таб-бар: **Сегодня · Календарь · Награды · Помощник**.

## Сегодня (`screens/TodayScreen.tsx`)
- `StreakFlame` — огонёк, интенсивность растёт с серией (0 → погас, 30+ → пылает).
- `StatsRow` — всего чистых дней / текущая серия / рекорд.
- `PrimaryButton` — «Сегодня без энергетика» (+ ссылка «Сорвалась сегодня»).
- `MotivationCard` — фраза под серию (`lib/motivation.ts`); при близости к ачивке — «осталось N дней».

## Календарь (`screens/CalendarScreen.tsx`)
- `MonthGrid` — месяц, недели с понедельника, цвета: clean=фиолет, drank=розовый, unmarked=тёмный;
  сегодня — кольцо; точка-индикатор на днях с заметкой.
- Тап по дню → `DayEditorSheet` (нижний шит): статус + заметка + «очистить день». Любой день, в т.ч. прошлый.

## Награды (`screens/AchievementsScreen.tsx`)
- Сетка ачивок 1/3/7/14/30/60/100 (`lib/achievements.ts`); открытые vs закрытые.
- `AchievementToast` — всплывающий тост при новой ачивке (триггерится из стора, `justUnlocked`).

## Помощник (`screens/ChatScreen.tsx`)
- Заглушка. Этап 3: Qwen через Cerebras, function calling (`write_day_note`, `set_day_status`).

## See also
- [[Architecture]] · [[Data Model]] · [[Roadmap]]
