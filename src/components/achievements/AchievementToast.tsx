import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useStore } from '../../lib/store'
import { achievementById } from '../../lib/achievements'

export default function AchievementToast() {
  const justUnlocked = useStore((s) => s.justUnlocked)
  const consume = useStore((s) => s.consumeJustUnlocked)
  const latest = justUnlocked[justUnlocked.length - 1]
  const ach = latest ? achievementById(latest) : undefined

  useEffect(() => {
    if (!ach) return
    const t = setTimeout(consume, 4200)
    return () => clearTimeout(t)
  }, [ach, consume])

  return (
    <AnimatePresence>
      {ach && (
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: 'spring', damping: 18, stiffness: 260 }}
          className="fixed inset-x-0 top-0 z-[60] mx-auto mt-[calc(env(safe-area-inset-top,0px)+12px)] flex max-w-sm items-center gap-3 rounded-2xl border border-primary/40 bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
          style={{ width: 'calc(100% - 32px)' }}
          onClick={consume}
        >
          <span className="text-3xl">{ach.secret ? '✨' : '🔥'}</span>
          <div>
            <div className="text-sm font-bold text-text">
              {ach.secret ? 'Секретная награда' : 'Награда'}: {ach.title}!
            </div>
            <div className="text-xs text-muted">{ach.description}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
