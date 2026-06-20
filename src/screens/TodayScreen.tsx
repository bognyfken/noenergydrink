import { useStore } from '../lib/store'
import { useStreak } from '../hooks/useStreak'
import { todayKey } from '../lib/date'
import { motivationFor } from '../lib/motivation'
import StreakFlame from '../components/today/StreakFlame'
import PrimaryButton from '../components/today/PrimaryButton'
import StatsRow from '../components/today/StatsRow'
import MotivationCard from '../components/today/MotivationCard'

export default function TodayScreen() {
  const today = todayKey()
  const status = useStore((s) => s.entries[today]?.status ?? 'unmarked')
  const setDay = useStore((s) => s.setDay)
  const { current, best, total } = useStreak()

  const seed = new Date().getDate()
  const motivation = motivationFor(current, seed)

  return (
    <div className="flex flex-col gap-7 pt-6">
      <header className="flex items-center justify-center pt-1">
        <h1 className="text-2xl font-bold text-text">Нет энергетикам</h1>
      </header>

      <section className="pt-2">
        <StreakFlame streak={current} />
      </section>

      <StatsRow total={total} current={current} best={best} />

      <PrimaryButton
        status={status}
        onMarkClean={() => setDay(today, 'clean')}
        onMarkDrank={() => setDay(today, 'drank')}
      />

      <MotivationCard text={motivation} />
    </div>
  )
}
