import { useState } from 'react'
import { LogOut, Settings, User } from 'lucide-react'
import { useStore } from '../lib/store'
import { useStreak } from '../hooks/useStreak'
import { todayKey } from '../lib/date'
import { motivationFor } from '../lib/motivation'
import StreakFlame from '../components/today/StreakFlame'
import PrimaryButton from '../components/today/PrimaryButton'
import StatsRow from '../components/today/StatsRow'
import MotivationCard from '../components/today/MotivationCard'
import Sheet from '../components/ui/Sheet'

export default function TodayScreen() {
  const today = todayKey()
  const status = useStore((s) => s.entries[today]?.status ?? 'unmarked')
  const setDay = useStore((s) => s.setDay)
  const session = useStore((s) => s.session)
  const logout = useStore((s) => s.logout)
  const { current, best, total } = useStreak()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const seed = new Date().getDate()
  const motivation = motivationFor(current, seed)

  return (
    <div className="flex flex-col gap-7 pt-6">
      <header className="relative flex items-center justify-center pt-1">
        <h1 className="text-2xl font-bold text-text">Нет энергетикам</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="tap absolute right-0 flex items-center justify-center text-muted"
          aria-label="профиль"
        >
          <Settings size={22} />
        </button>
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

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Профиль">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-bg/50 px-4 py-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/25 text-lavender">
              <User size={22} />
            </span>
            <div>
              <div className="font-semibold text-text">{session?.name}</div>
              <div className="text-xs text-muted">Это твой профиль</div>
            </div>
          </div>
          <button
            onClick={() => {
              setSettingsOpen(false)
              logout()
            }}
            className="tap flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-3.5 font-semibold text-drank"
          >
            <LogOut size={18} /> Выйти / сменить профиль
          </button>
        </div>
      </Sheet>
    </div>
  )
}
