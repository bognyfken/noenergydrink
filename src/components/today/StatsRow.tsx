import { dayWord } from '../../lib/plural'

interface Props {
  total: number
  current: number
  best: number
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-2xl bg-surface/70 py-3">
      <span className="text-2xl font-bold text-text">{value}</span>
      <span className="mt-0.5 text-[11px] text-muted">{label}</span>
    </div>
  )
}

export default function StatsRow({ total, current, best }: Props) {
  return (
    <div className="flex gap-3">
      <Stat value={total} label={`всего ${dayWord(total)}`} />
      <Stat value={current} label="серия" />
      <Stat value={best} label="рекорд" />
    </div>
  )
}
