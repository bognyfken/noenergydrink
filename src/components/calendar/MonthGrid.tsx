import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { dateKey, todayKey, WEEKDAYS_SHORT } from '../../lib/date'
import type { DayEntry } from '../../lib/types'

interface Props {
  month: Date
  entries: Record<string, DayEntry>
  onSelectDay: (key: string) => void
}

const STATUS_CLASS: Record<string, string> = {
  clean: 'bg-clean text-white',
  drank: 'bg-drank/80 text-white',
  unmarked: 'bg-unmarked text-muted',
}

export default function MonthGrid({ month, entries, onSelectDay }: Props) {
  // недели начинаются с понедельника (weekStartsOn: 1)
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const today = todayKey()

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAYS_SHORT.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const key = dateKey(d)
          const inMonth = isSameMonth(d, month)
          const entry = entries[key]
          const status = entry?.status ?? 'unmarked'
          const isToday = key === today
          const hasNote = !!entry?.note

          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={[
                'tap relative flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition-transform active:scale-90',
                STATUS_CLASS[status],
                inMonth ? '' : 'opacity-30',
                isToday ? 'ring-2 ring-lavender ring-offset-2 ring-offset-bg' : '',
              ].join(' ')}
            >
              {d.getDate()}
              {hasNote && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-white/80" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
