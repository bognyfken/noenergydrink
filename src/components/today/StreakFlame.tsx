import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { dayWord } from '../../lib/plural'

interface Props {
  streak: number
}

/** Интенсивность огонька растёт с серией. */
function level(streak: number) {
  if (streak <= 0) return { size: 88, color: '#5b4a7a', glow: 0.0, label: 'погас' }
  if (streak < 3) return { size: 100, color: '#c9a15e', glow: 0.25, label: 'разгорается' }
  if (streak < 7) return { size: 116, color: '#e8924a', glow: 0.4, label: 'горит' }
  if (streak < 30) return { size: 132, color: '#f0a35e', glow: 0.55, label: 'жарко' }
  return { size: 148, color: '#ffb86b', glow: 0.75, label: 'пылает' }
}

export default function StreakFlame({ streak }: Props) {
  const lv = level(streak)
  const alive = streak > 0

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        {alive && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: lv.size * 1.7,
              height: lv.size * 1.7,
              background: `radial-gradient(circle, rgba(240,163,94,${lv.glow}) 0%, transparent 70%)`,
            }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <motion.div
          animate={
            alive
              ? { scale: [1, 1.05, 0.98, 1], rotate: [0, -2, 2, 0] }
              : { scale: 1 }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame
            size={lv.size}
            color={lv.color}
            fill={alive ? lv.color : 'transparent'}
            strokeWidth={1.4}
            style={{ filter: alive ? 'drop-shadow(0 0 14px rgba(240,163,94,0.5))' : 'none' }}
          />
        </motion.div>
      </div>

      <motion.div
        key={streak}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 280 }}
        className="-mt-2 text-center"
      >
        <div className="text-6xl font-extrabold tracking-tight text-text">{streak}</div>
        <div className="mt-1 text-sm text-muted">
          {streak === 0
            ? 'начни серию сегодня'
            : `${streak} ${dayWord(streak)} подряд`}
        </div>
      </motion.div>
    </div>
  )
}
