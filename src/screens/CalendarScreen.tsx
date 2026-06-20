import { useState } from 'react'
import { addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MonthGrid from '../components/calendar/MonthGrid'
import DayEditorSheet from '../components/calendar/DayEditorSheet'
import { monthTitle } from '../lib/date'
import { useStore } from '../lib/store'

export default function CalendarScreen() {
  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState<string | null>(null)
  const entries = useStore((s) => s.entries)

  return (
    <div className="flex flex-col gap-5 pt-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Календарь</h1>
      </header>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="tap flex items-center justify-center rounded-full bg-surface/70 p-2 text-muted"
          aria-label="предыдущий месяц"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold capitalize text-text">
          {monthTitle(month)}
        </span>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="tap flex items-center justify-center rounded-full bg-surface/70 p-2 text-muted"
          aria-label="следующий месяц"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <MonthGrid month={month} entries={entries} onSelectDay={setSelected} />

      <div className="flex justify-center gap-4 pt-1 text-xs text-muted">
        <Legend className="bg-clean" label="без энергетика" />
        <Legend className="bg-drank/80" label="сорвалась" />
        <Legend className="bg-unmarked" label="не отмечено" />
      </div>

      <DayEditorSheet dateKey={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-3 w-3 rounded-md ${className}`} />
      {label}
    </span>
  )
}
