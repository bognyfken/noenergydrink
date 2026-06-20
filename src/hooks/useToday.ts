// Реактивный ключ «сегодня» в локальной зоне телефона.
// Сам переключается в 00:00, пока приложение открыто, и пересчитывается
// при возврате в приложение (таймеры в фоне на iOS душатся — одного таймера мало).

import { useEffect, useState } from 'react'
import { todayKey } from '../lib/date'

/** Миллисекунд до ближайшей локальной полуночи (+1с запас, чтобы дата уже сменилась). */
function msUntilNextMidnight(): number {
  const now = new Date()
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime() + 1000
}

/** Ключ сегодняшнего дня 'YYYY-MM-DD', обновляется в 00:00 и при фокусе. */
export function useToday(): string {
  const [today, setToday] = useState(todayKey)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    // обновить ключ и перезапланировать на следующую полночь
    const tick = () => {
      setToday(todayKey())
      timer = setTimeout(tick, msUntilNextMidnight())
    }
    timer = setTimeout(tick, msUntilNextMidnight())

    // при возврате в приложение таймер мог не сработать — пересчитываем сразу
    const onWake = () => {
      if (document.visibilityState === 'visible') {
        setToday(todayKey())
        clearTimeout(timer)
        timer = setTimeout(tick, msUntilNextMidnight())
      }
    }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [])

  return today
}
