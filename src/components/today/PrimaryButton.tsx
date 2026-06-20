import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import type { DayStatus } from '../../lib/types'

interface Props {
  status: DayStatus
  onMarkClean: () => void
  onMarkDrank: () => void
}

export default function PrimaryButton({ status, onMarkClean, onMarkDrank }: Props) {
  const clean = status === 'clean'
  const drank = status === 'drank'

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onMarkClean}
        className={[
          'tap flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-soft)] px-6 py-5 text-lg font-bold shadow-lg transition-colors',
          clean
            ? 'bg-clean/25 text-lavender ring-2 ring-clean/60'
            : 'bg-gradient-to-r from-primary to-accent text-white shadow-primary/30',
        ].join(' ')}
      >
        {clean ? (
          <>
            <Check size={22} strokeWidth={3} />
            Сегодня без энергетика
          </>
        ) : (
          <>
            <Zap size={22} className="rotate-12" />
            Сегодня без энергетика
          </>
        )}
      </motion.button>

      <button
        onClick={onMarkDrank}
        className={[
          'tap text-sm transition-colors',
          drank ? 'font-semibold text-drank' : 'text-muted hover:text-drank',
        ].join(' ')}
      >
        {drank ? '✕ Отмечено: сегодня сорвалась' : 'Сорвалась сегодня'}
      </button>
    </div>
  )
}
