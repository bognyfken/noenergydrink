import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { ACHIEVEMENTS } from '../lib/achievements'
import { useStore } from '../lib/store'
import { useStreak } from '../hooks/useStreak'
import { dayWord } from '../lib/plural'

export default function AchievementsScreen() {
  const unlocked = useStore((s) => s.unlocked)
  const { best } = useStreak()

  return (
    <div className="flex flex-col gap-5 pt-6">
      <header>
        <h1 className="text-xl font-bold text-text">Награды</h1>
        <p className="mt-1 text-sm text-muted">
          Рекорд серии: {best} {dayWord(best)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((a, i) => {
          const isOpen = !!unlocked[a.id]
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={[
                'flex flex-col items-center gap-2 rounded-[var(--radius-soft)] border p-4 text-center',
                isOpen
                  ? 'border-primary/40 bg-gradient-to-br from-primary/25 to-lavender/10'
                  : 'border-white/5 bg-surface/50',
              ].join(' ')}
            >
              <div
                className={[
                  'flex h-14 w-14 items-center justify-center rounded-full text-2xl',
                  isOpen ? 'bg-clean/30' : 'bg-unmarked',
                ].join(' ')}
              >
                {isOpen ? '🔥' : <Lock size={22} className="text-muted" />}
              </div>
              <div className="text-sm font-bold text-text">{a.title}</div>
              <div className="text-[11px] leading-snug text-muted">
                {isOpen ? a.description : `${a.days} ${dayWord(a.days)} подряд`}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
