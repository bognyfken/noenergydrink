import { useEffect, useState } from 'react'
import { Check, Trash2, Zap } from 'lucide-react'
import Sheet from '../ui/Sheet'
import { humanDay } from '../../lib/date'
import { useStore } from '../../lib/store'

interface Props {
  dateKey: string | null
  onClose: () => void
}

export default function DayEditorSheet({ dateKey, onClose }: Props) {
  const entry = useStore((s) => (dateKey ? s.entries[dateKey] : undefined))
  const setDay = useStore((s) => s.setDay)
  const setNote = useStore((s) => s.setNote)
  const clearDay = useStore((s) => s.clearDay)

  const [note, setNoteText] = useState('')

  // подгружаем заметку при открытии нового дня
  useEffect(() => {
    setNoteText(entry?.note ?? '')
  }, [dateKey, entry?.note])

  const status = entry?.status ?? 'unmarked'
  const open = dateKey !== null

  const handleClose = () => {
    if (dateKey && note.trim() !== (entry?.note ?? '')) {
      void setNote(dateKey, note.trim())
    }
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={dateKey ? humanDay(dateKey) : ''}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <StatusButton
            active={status === 'clean'}
            onClick={() => dateKey && setDay(dateKey, 'clean', note.trim() || undefined)}
            className="bg-clean/20 text-lavender ring-clean/60"
            icon={<Check size={20} strokeWidth={3} />}
            label="Без энергетика"
          />
          <StatusButton
            active={status === 'drank'}
            onClick={() => dateKey && setDay(dateKey, 'drank', note.trim() || undefined)}
            className="bg-drank/20 text-drank ring-drank/60"
            icon={<Zap size={20} />}
            label="Сорвалась"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-muted">Заметка о дне</label>
          <textarea
            value={note}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Как прошёл день? Была ли тяга, как ты справилась…"
            rows={4}
            className="w-full resize-none rounded-2xl border border-white/10 bg-bg/60 p-3 text-text placeholder:text-muted/60 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (dateKey) void clearDay(dateKey)
              setNoteText('')
              onClose()
            }}
            className="tap flex items-center gap-1.5 text-sm text-muted hover:text-drank"
          >
            <Trash2 size={16} />
            Очистить день
          </button>
          <button
            onClick={handleClose}
            className="tap rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white"
          >
            Готово
          </button>
        </div>
      </div>
    </Sheet>
  )
}

function StatusButton({
  active,
  onClick,
  className,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  className: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'tap flex flex-col items-center gap-1.5 rounded-2xl py-4 text-sm font-semibold transition-all',
        className,
        active ? 'ring-2' : 'opacity-70 ring-0',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  )
}
