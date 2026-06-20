import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, User } from 'lucide-react'
import {
  cloudCreateProfile,
  cloudListProfiles,
  type CloudProfile,
} from '../lib/supabase'
import { deriveDid, makeVerifier, MIN_CODE_LENGTH, randomToken } from '../lib/auth'
import { useStore } from '../lib/store'

type View = 'list' | 'login' | 'create'

export default function AuthScreen() {
  const login = useStore((s) => s.login)
  const [profiles, setProfiles] = useState<CloudProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<CloudProfile | null>(null)

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const list = await cloudListProfiles()
      setProfiles(list)
      setLoading(false)
      if (list.length === 0) setView('create')
    })()
  }, [])

  function reset() {
    setName('')
    setCode('')
    setConfirm('')
    setError('')
  }

  async function handleLogin() {
    if (!selected || code.length < MIN_CODE_LENGTH) return
    setBusy(true)
    setError('')
    const v = await makeVerifier(selected.salt, code)
    if (v !== selected.verifier) {
      setError('Неверный код доступа')
      setBusy(false)
      return
    }
    const did = await deriveDid(selected.id, selected.salt, code)
    await login(
      { profileId: selected.id, name: selected.name, did },
      { id: selected.id, name: selected.name, salt: selected.salt, verifier: selected.verifier },
    )
  }

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed) return setError('Введи имя')
    if (code.length < MIN_CODE_LENGTH)
      return setError(`Код минимум ${MIN_CODE_LENGTH} символа`)
    if (code !== confirm) return setError('Коды не совпадают')
    if (profiles.some((p) => p.name.toLowerCase() === trimmed.toLowerCase()))
      return setError('Профиль с таким именем уже есть')

    setBusy(true)
    setError('')
    const id = randomToken(8)
    const salt = randomToken(16)
    const verifier = await makeVerifier(salt, code)
    const ok = await cloudCreateProfile({ id, name: trimmed, salt, verifier })
    if (!ok) {
      setError('Не удалось создать профиль. Проверь интернет.')
      setBusy(false)
      return
    }
    const did = await deriveDid(id, salt, code)
    await login(
      { profileId: id, name: trimmed, did },
      { id, name: trimmed, salt, verifier },
    )
  }

  return (
    <div className="app-shell items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex w-full max-w-sm flex-col items-center"
      >
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src="/logo.png"
            alt=""
            className="h-20 w-20 rounded-3xl shadow-lg shadow-primary/30"
          />
          <h1 className="text-2xl font-bold text-text">Нет энергетикам</h1>
          <p className="text-center text-sm text-muted">
            {view === 'create'
              ? 'Создай профиль, чтобы твоя статистика была только твоей'
              : 'Выбери профиль, чтобы войти'}
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-sm text-muted">Загрузка…</div>
        ) : view === 'list' ? (
          <div className="flex w-full flex-col gap-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelected(p)
                  reset()
                  setView('login')
                }}
                className="tap flex items-center gap-3 rounded-2xl border border-white/5 bg-surface/70 px-4 py-4 text-left transition-colors active:bg-surface"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/25 text-lavender">
                  <User size={20} />
                </span>
                <span className="font-semibold text-text">{p.name}</span>
              </button>
            ))}
            <button
              onClick={() => {
                reset()
                setView('create')
              }}
              className="tap flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-4 text-muted"
            >
              <Plus size={18} /> Новый профиль
            </button>
          </div>
        ) : view === 'login' ? (
          <Form
            onBack={() => setView('list')}
            title={selected?.name ?? ''}
            error={error}
            busy={busy}
            submitLabel="Войти"
            onSubmit={handleLogin}
            canSubmit={code.length >= MIN_CODE_LENGTH}
          >
            <CodeInput value={code} onChange={setCode} placeholder="Код доступа" autoFocus />
          </Form>
        ) : (
          <Form
            onBack={profiles.length ? () => setView('list') : undefined}
            title="Новый профиль"
            error={error}
            busy={busy}
            submitLabel="Создать"
            onSubmit={handleCreate}
            canSubmit={!!name.trim() && code.length >= MIN_CODE_LENGTH && !!confirm}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя (например, Олеся)"
              className="w-full rounded-2xl border border-white/10 bg-bg/60 px-4 py-3.5 text-text placeholder:text-muted/60 focus:border-primary focus:outline-none"
            />
            <CodeInput value={code} onChange={setCode} placeholder="Придумай код доступа" />
            <CodeInput value={confirm} onChange={setConfirm} placeholder="Повтори код" />
            <p className="px-1 text-xs text-muted">
              Код может быть любой длины — например, важная дата. Запомни его: восстановить нельзя.
            </p>
          </Form>
        )}
      </motion.div>
    </div>
  )
}

function Form({
  title,
  onBack,
  error,
  busy,
  submitLabel,
  onSubmit,
  canSubmit,
  children,
}: {
  title: string
  onBack?: () => void
  error: string
  busy: boolean
  submitLabel: string
  onSubmit: () => void
  canSubmit: boolean
  children: React.ReactNode
}) {
  return (
    <form
      className="flex w-full flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit && !busy) onSubmit()
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        {onBack && (
          <button type="button" onClick={onBack} className="tap text-muted">
            <ArrowLeft size={20} />
          </button>
        )}
        <span className="font-display text-lg font-bold text-text">{title}</span>
      </div>
      {children}
      {error && <p className="px-1 text-sm text-drank">{error}</p>}
      <button
        type="submit"
        disabled={!canSubmit || busy}
        className="tap mt-1 rounded-2xl bg-gradient-to-r from-primary to-accent py-3.5 font-bold text-white shadow-lg shadow-primary/30 disabled:opacity-40"
      >
        {busy ? '…' : submitLabel}
      </button>
    </form>
  )
}

function CodeInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoFocus?: boolean
}) {
  return (
    <input
      type="password"
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/10 bg-bg/60 px-4 py-3.5 tracking-widest text-text placeholder:tracking-normal placeholder:text-muted/60 focus:border-primary focus:outline-none"
    />
  )
}
