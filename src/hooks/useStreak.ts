// Производные значения серии/статистики из стора.

import { useMemo } from 'react'
import { useStore } from '../lib/store'
import {
  computeBestStreak,
  computeCurrentStreak,
  computeTotalCleanDays,
  toEntryMap,
} from '../lib/streak'

export function useStreak() {
  const entries = useStore((s) => s.entries)
  return useMemo(() => {
    const map = toEntryMap(Object.values(entries))
    return {
      current: computeCurrentStreak(map),
      best: computeBestStreak(map),
      total: computeTotalCleanDays(map),
    }
  }, [entries])
}
