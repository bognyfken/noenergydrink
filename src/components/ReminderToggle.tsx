import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { disablePush, enablePush, getPushState, type PushState } from '../lib/push'
import { useStore } from '../lib/store'

export default function ReminderToggle() {
  const did = useStore((s) => s.session?.did)
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void getPushState().then(setState)
  }, [])

  async function toggle() {
    if (busy || !did) return
    setBusy(true)
    try {
      setState(state === 'on' ? await disablePush() : await enablePush(did))
    } finally {
      setBusy(false)
    }
  }

  const on = state === 'on'
  const interactive = state === 'on' || state === 'off'

  const hint =
    state === 'denied'
      ? 'Уведомления запрещены — включи их для приложения в настройках телефона'
      : state === 'needs-install'
        ? 'Добавь приложение на экран «Домой», чтобы включить напоминания'
        : state === 'unsupported'
          ? 'Этот браузер не поддерживает напоминания'
          : on
            ? 'Каждый вечер напомню отметить день'
            : 'Напоминать отмечать день каждый вечер'

  return (
    <button
      onClick={toggle}
      disabled={!interactive || busy}
      className="tap flex items-center gap-3 rounded-2xl bg-bg/50 px-4 py-3 text-left disabled:opacity-100"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/25 text-lavender">
        <Bell size={20} />
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-text">Напоминания</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      {interactive && (
        <span
          className={[
            'relative h-6 w-11 shrink-0 rounded-full transition-colors',
            on ? 'bg-primary' : 'bg-white/15',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all',
              on ? 'left-[22px]' : 'left-0.5',
            ].join(' ')}
          />
        </span>
      )}
    </button>
  )
}
