import { motion } from 'framer-motion'
import {
  CalendarHeart,
  CheckCircle2,
  Flame,
  Heart,
  Lock,
  Pencil,
  Sigma,
  Sparkles,
  Trophy,
} from 'lucide-react'
import {
  achievementImage,
  ACHIEVEMENTS,
  type AchievementDef,
} from '../lib/achievements'
import { useStore } from '../lib/store'
import { useStreak } from '../hooks/useStreak'
import { dayWord } from '../lib/plural'

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

function FallbackIcon({ def, open }: { def: AchievementDef; open: boolean }) {
  const color = open ? '#cdb4f6' : '#6b5d86'
  const size = 30
  // секрет ещё не открыт — не выдаём категорию, показываем загадочную искру
  if (def.secret && !open) return <Sparkles size={size} color={color} />
  switch (def.category) {
    case 'total':
      return <Sigma size={size} color={color} />
    case 'comeback':
      return <Heart size={size} color={color} fill={open ? color : 'none'} />
    case 'calendar':
      return <CalendarHeart size={size} color={color} />
    case 'logging':
      return <CheckCircle2 size={size} color={color} />
    case 'notes':
      return <Pencil size={size} color={color} />
    default:
      return <Flame size={size} color={color} /> // длинные серии без арта
  }
}

function BadgeCard({ def, open, index }: { def: AchievementDef; open: boolean; index: number }) {
  const img = achievementImage(def)
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
        {img ? (
          <img
            src={img}
            alt=""
            className={['h-16 w-16 object-contain', open ? '' : 'opacity-30 grayscale'].join(' ')}
          />
        ) : (
          <div
            className={[
              'flex h-16 w-16 items-center justify-center rounded-full',
              open ? 'bg-primary/25' : 'bg-unmarked',
            ].join(' ')}
          >
            <FallbackIcon def={def} open={open} />
          </div>
        )}
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
