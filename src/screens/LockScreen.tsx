import { useState } from 'react'
import { motion } from 'framer-motion'
import { Delete } from 'lucide-react'
import { useStore } from '../lib/store'
import { deriveDid, makeVerifier, MIN_CODE_LENGTH } from '../lib/auth'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export default function LockScreen() {
  const device = useStore((s) => s.device)
  const login = useStore((s) => s.login)
  const forgetDevice = useStore((s) => s.forgetDevice)

  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!device) return null

  async function tryUnlock(c: string): Promise<boolean> {
    if (!device || c.length < MIN_CODE_LENGTH) return false
    const v = await makeVerifier(device.salt, c)
    if (v !== device.verifier) return false
    setBusy(true)
    const did = await deriveDid(device.id, device.salt, c)
    await login({ profileId: device.id, name: device.name, did })
    return true
  }

  function press(d: string) {
    if (busy) return
    setError(false)
    const next = code + d
    setCode(next)
    void tryUnlock(next)
  }

  function backspace() {
    setError(false)
    setCode((c) => c.slice(0, -1))
  }

  async function submit() {
    if (busy || code.length < MIN_CODE_LENGTH) return
    const ok = await tryUnlock(code)
    if (!ok) {
      setError(true)
      setCode('')
    }
  }

  return (
    <div className="app-shell items-center justify-between px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <img src="/logo.png" alt="" className="h-20 w-20 rounded-3xl shadow-lg shadow-primary/30" />
        <div className="text-center">
          <div className="text-sm text-muted">С возвращением</div>
          <div className="font-display text-2xl font-bold text-text">{device.name}</div>
        </div>

        {/* точки введённого кода */}
        <motion.div
          className="flex h-6 items-center gap-2.5"
          animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {code.length === 0 ? (
            <span className="text-sm text-muted">введи код доступа</span>
          ) : (
            Array.from({ length: Math.min(code.length, 12) }).map((_, i) => (
              <span key={i} className="h-3 w-3 rounded-full bg-lavender" />
            ))
          )}
        </motion.div>
        {error && <div className="-mt-3 text-sm text-drank">Неверный код</div>}
      </div>

      {/* клавиатура */}
      <div className="grid w-full max-w-xs grid-cols-3 gap-4">
        {KEYS.map((k) => (
          <Key key={k} onClick={() => press(k)}>
            {k}
          </Key>
        ))}
        <button
          onClick={() => forgetDevice()}
          className="tap flex items-center justify-center text-xs font-medium text-muted"
        >
          другой профиль
        </button>
        <Key onClick={() => press('0')}>0</Key>
        {code.length >= MIN_CODE_LENGTH ? (
          <Key onClick={submit} variant="accent">
            <span className="text-lg">→</span>
          </Key>
        ) : (
          <button
            onClick={backspace}
            disabled={!code.length}
            className="tap flex items-center justify-center text-muted disabled:opacity-30"
            aria-label="стереть"
          >
            <Delete size={26} />
          </button>
        )}
      </div>
    </div>
  )
}

function Key({
  children,
  onClick,
  variant,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'accent'
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'tap mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-full text-2xl font-light transition-transform active:scale-90',
        variant === 'accent'
          ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30'
          : 'border border-white/10 bg-surface/60 text-text active:bg-surface',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
