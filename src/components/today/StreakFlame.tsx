import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { dayWord } from '../../lib/plural'

interface Props {
  streak: number
}

/** Интенсивность и цвет огонька растут с серией. */
function level(streak: number) {
  if (streak <= 0)
    return { size: 176, outer: '#5b4a7a', inner: '#7a6699', glow: 0, alive: false }
  if (streak < 3)
    return { size: 184, outer: '#e0843a', inner: '#ffd27a', glow: 0.3, alive: true }
  if (streak < 7)
    return { size: 196, outer: '#ec7a2c', inner: '#ffd166', glow: 0.42, alive: true }
  if (streak < 30)
    return { size: 208, outer: '#f5872f', inner: '#ffdf8a', glow: 0.55, alive: true }
  return { size: 220, outer: '#ff7a1a', inner: '#fff0a8', glow: 0.7, alive: true }
}

export default function StreakFlame({ streak }: Props) {
  const lv = level(streak)
  const { alive } = lv

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: lv.size, height: lv.size }}
      >
        {/* свечение */}
        {alive && (
          <motion.div
            className="absolute rounded-full"
            style={{
              width: lv.size * 1.5,
              height: lv.size * 1.5,
              background: `radial-gradient(circle, rgba(255,150,60,${lv.glow}) 0%, transparent 68%)`,
            }}
            animate={{ scale: [1, 1.12, 0.97, 1.08, 1], opacity: [0.7, 1, 0.8, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* внешнее пламя */}
        <motion.div
          className="absolute"
          animate={
            alive
              ? { scale: [1, 1.04, 0.99, 1.05, 1], rotate: [0, -2.5, 1.5, -1, 0], y: [0, -3, 1, -2, 0] }
              : {}
          }
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Flame
            size={lv.size}
            color={lv.outer}
            fill={lv.outer}
            strokeWidth={1}
            style={{ filter: alive ? 'drop-shadow(0 0 22px rgba(255,140,50,0.55))' : 'none' }}
          />
        </motion.div>

        {/* внутреннее (яркое) пламя */}
        {alive && (
          <motion.div
            className="absolute"
            style={{ marginTop: lv.size * 0.16 }}
            animate={{ scale: [1, 1.08, 0.95, 1.06, 1], rotate: [0, 2, -2, 1, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flame size={lv.size * 0.62} color={lv.inner} fill={lv.inner} strokeWidth={0} />
          </motion.div>
        )}

        {/* цифра серии внутри пламени */}
        <motion.div
          key={streak}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 13, stiffness: 300 }}
          className="absolute font-display font-bold leading-none"
          style={{
            top: '52%',
            fontSize: lv.size * 0.3,
            color: alive ? '#fff' : '#cdbce8',
            textShadow: alive ? '0 2px 12px rgba(120,40,0,0.6)' : 'none',
          }}
        >
          {streak}
        </motion.div>
      </div>

      <div className="mt-1 text-sm text-muted">
        {streak === 0 ? 'начни серию сегодня' : `${dayWord(streak)} подряд`}
      </div>
    </div>
  )
}
