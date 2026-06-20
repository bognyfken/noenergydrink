import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../lib/store'

// Запасные быстрые ответы, если Кабанёнок ещё не сгенерировал свои (офлайн/первый запуск).
const FALLBACK_REPLIES = ['Справилась, было легко', 'Справилась, но тяжело', 'Сорвалась сегодня']

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Тёплая карточка-приветствие при открытии: вопрос Кабанёнка + 3 быстрых ответа
 * (генерит он сам) + поле ввода. После выбора/отправки — переброс в чат «Помощник»,
 * где разговор продолжается.
 */
export default function GreetingCard({ open, onClose }: Props) {
  const navigate = useNavigate()
  const quick = useStore((s) => s.warm?.quickReplies)
  const name = useStore((s) => s.session?.name)
  const [text, setText] = useState('')

  const replies = quick && quick.length >= 3 ? quick.slice(0, 3) : FALLBACK_REPLIES

  function go(message: string) {
    const m = message.trim()
    if (!m) return
    onClose()
    navigate('/chat', { state: { send: m } })
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md flex-col gap-4 rounded-t-[28px] border-t border-white/10 bg-surface px-5 pt-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="flex items-start gap-3">
              <img src="/logo.png" alt="" className="h-10 w-10 shrink-0 rounded-2xl" />
              <p className="flex-1 pt-0.5 text-sm leading-relaxed text-text">
                Привет{name ? `, ${name}` : ''} 💜 Я Кабанёнок. Как прошёл твой день — тяжело было
                держаться?
              </p>
              <button
                onClick={onClose}
                aria-label="закрыть"
                className="tap -mr-2 -mt-1 flex shrink-0 items-start justify-end text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {replies.map((r) => (
                <button
                  key={r}
                  onClick={() => go(r)}
                  className="tap rounded-2xl border border-white/10 bg-bg/40 px-4 py-3 text-left text-sm text-text transition-colors active:bg-bg/70"
                >
                  {r}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                go(text)
              }}
              className="flex items-center gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Или расскажи своими словами…"
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-bg/40 px-4 py-3 text-text outline-none transition-colors placeholder:text-muted focus:border-primary/60"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label="отправить"
                className="tap flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white transition-opacity disabled:opacity-40"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
