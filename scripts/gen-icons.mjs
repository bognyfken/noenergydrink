// Генерация PNG-иконок PWA из scripts/icon-source.svg через sharp.
// Запуск: node scripts/gen-icons.mjs

import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'

const here = dirname(fileURLToPath(import.meta.url))
const src = join(here, 'icon-source.svg')
const outDir = join(here, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180, bg: '#160f22' }, // непрозрачный фон для iOS
]

for (const t of targets) {
  let img = sharp(src).resize(t.size, t.size)
  if (t.bg) img = img.flatten({ background: t.bg })
  await img.png().toFile(join(outDir, t.file))
  console.log('✓', t.file, `${t.size}x${t.size}`)
}

console.log('Готово.')
