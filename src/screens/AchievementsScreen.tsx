import { motion } from 'framer-motion'
import { Lock, Trophy } from 'lucide-react'
import { ACHIEVEMENTS, type AchievementDef } from '../lib/achievements'
import { useStore } from '../lib/store'
import { useStreak } from '../hooks/useStreak'
import { dayWord } from '../lib/plural'

// Эмодзи под каждую ачивку (временно, пока не вернём картинки-медали).
const EMOJI: Record<string, string> = {
  // серия подряд
  d1: '🔥', d3: '🔥', d7: '🔥', d14: '🔥', d21: '🌱', d30: '🌿',
  d60: '🔥', d90: '🌳', d100: '💯', d180: '🏅', d365: '👑',
  // всего чистых дней
  total7: '⭐', total30: '🌟', total50: '🪙', total100: '💎', total200: '💠', total365: '🏆',
  // возвращение после срыва
  comeback: '💗', comeback3: '💪',
  // календарные узоры
  weekend1: '😌', weekend4: '🛋️', week_cal: '📅', month_cal: '📆',
  month20: '🗓️', monday4: '☕', seasons: '🍂', newyear: '🎉',
  // дисциплина учёта
  log7: '✅', log30: '📋', marked50: '✍️',
  // заметки
  note1: '📝', note10: '📖',
  // секретные
  leapday: '🗓️', friday13: '🐈‍⬛', night_owl: '🦉', second_wind: '🌬️', phoenix: '🦅',
}

function emojiFor(def: AchievementDef): string {
  return EMOJI[def.id] ?? '🏅'
}

export default function AchievementsScreen() {
  const unlocked = useStore((s) => s.unlocked)
  const { best } = useStreak()
  const openCount = ACHIEVEMENTS.filter((a) => unlocked[a.id]).length

  return (
    <div className="flex flex-col gap-5 pt-6">
      <header>
        <h1 className="text-xl font-bold text-text">Награды</h1>
        <p className="mt-1 text-sm text-muted">
          Рекорд серии: {best} {dayWord(best)} · открыто {openCount} из {ACHIEVEMENTS.length}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 pb-2">
        {ACHIEVEMENTS.map((a, i) => (
          <BadgeCard key={a.id} def={a} open={!!unlocked[a.id]} index={i} />
        ))}
      </div>
    </div>
  )
}

function BadgeCard({ def, open, index }: { def: AchievementDef; open: boolean; index: number }) {
  const secretLocked = !!def.secret && !open
  let caption: string
  if (open) caption = def.description
  else if (secretLocked) caption = 'Секретная награда — откроется сама 💜'
  else caption = def.hint

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={[
        'flex flex-col items-center gap-2 rounded-[var(--radius-soft)] border p-4 text-center',
        open
          ? 'border-primary/40 bg-gradient-to-br from-primary/25 to-lavender/10'
          : 'border-white/5 bg-surface/50',
      ].join(' ')}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div
          className={[
            'flex h-16 w-16 items-center justify-center rounded-full text-3xl',
            open ? 'bg-clean/25' : 'bg-unmarked opacity-40 grayscale',
          ].join(' ')}
        >
          {secretLocked ? '❓' : emojiFor(def)}
        </div>
        {!open && (
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-bg/90 ring-1 ring-white/10">
            <Lock size={13} className="text-muted" />
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 text-sm font-bold text-text">
        {open && def.category === 'streak' && (def.goal ?? 0) >= 30 && (
          <Trophy size={13} className="text-lavender" />
        )}
        {secretLocked ? '???' : def.title}
      </div>
      <div className="text-[11px] leading-snug text-muted">{caption}</div>
    </motion.div>
  )
}
