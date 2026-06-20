import { HeartHandshake } from 'lucide-react'
import { useStore } from '../lib/store'

/** Тумблер «Кабанёнок встречает при открытии» в настройках профиля. */
export default function GreetingToggle() {
  const enabled = useStore((s) => s.greetingEnabled)
  const setEnabled = useStore((s) => s.setGreetingEnabled)

  return (
    <button
      onClick={() => void setEnabled(!enabled)}
      className="tap flex items-center gap-3 rounded-2xl bg-bg/50 px-4 py-3 text-left"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/25 text-lavender">
        <HeartHandshake size={20} />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-text">Кабанёнок встречает</span>
        <span className="block text-xs text-muted">
          {enabled ? 'Спрошу, как прошёл день, когда зайдёшь' : 'Не буду встречать при заходе'}
        </span>
      </span>
      <span
        className={[
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          enabled ? 'bg-primary' : 'bg-white/15',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
            enabled ? 'left-[22px]' : 'left-0.5',
          ].join(' ')}
        />
      </span>
    </button>
  )
}
