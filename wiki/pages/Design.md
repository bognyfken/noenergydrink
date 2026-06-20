# Design

**Last updated:** 2026-06-20

---

## Тон
Тёплый, спокойный, поддерживающий. Не клинический, не резкий. Срыв не осуждается.

## Палитра (`src/index.css`, `@theme`)
- bg `#160f22`, surface `#241934`, surface-2/unmarked `#2e2342`
- primary `#7c5cbf`, accent `#a78bda`, lavender `#cdb4f6`
- text `#f3eefb`, muted `#9a8cb5`
- clean `#7c5cbf`, drank `#c46b8a`, flame `#f0a35e`
- Фон body — мягкий радиальный фиолетовый градиент.

## Шрифт
Manrope Variable (`@fontsource-variable/manrope`) — кириллица, тёплый, скруглённый. Локально (офлайн).

## Мотив
Перечёркнутая банка энергетика — `src/components/CanMark.tsx` (в шапке «Сегодня») и в иконке
(`scripts/icon-source.svg`: огонёк + маленькая перечёркнутая банка на фиолетовом градиенте).

## Бейджи наград
Круглая медаль-монета, мягкий 3D claymorphism (матовая эмаль/пластилин): объёмный кант,
вдавленный/выпуклый символ по центру, мягкий свет, прозрачный/белый фон. Цвет канта растёт с
рангом: лаванда → глубокий фиолет → тёмный + золото (+ свечение у секретных). Файлы —
`public/achievements/<id>.webp`. Промты для генерации в Nano Banana —
[[2026-06-20 промты Nano Banana для бейджей]].

## iOS-адаптив
- `viewport-fit=cover` + `env(safe-area-inset-*)`; `100dvh`; тач-цели ≥44px;
  поля ввода 16px (нет зума); `maximum-scale=1`.
- Анимации Framer Motion мягкие (пружины), уважают `prefers-reduced-motion`.

## See also
- [[Features]] · [[Architecture]]
