import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, MessageSquareText, RotateCcw, Send, SquarePen } from 'lucide-react'
import { useStore } from '../lib/store'
import ConversationsSheet from '../components/ConversationsSheet'

// Тёплый чат с Кабанёнком. История бесед (список/новый/переключение), отправка
// сообщений, исполнение его действий с днями (через стор), плашка «отменить»,
// состояние «печатает» и мягкие ошибки. При переходе из приветствия
// (location.state.send) — авто-отправка первой реплики.

export default function ChatScreen() {
  const allMessages = useStore((s) => s.messages)
  const activeId = useStore((s) => s.activeConversationId)
  const conversations = useStore((s) => s.conversations)
  const chatBusy = useStore((s) => s.chatBusy)
  const chatError = useStore((s) => s.chatError)
  const lastToolActions = useStore((s) => s.lastToolActions)
  const sendMessage = useStore((s) => s.sendMessage)
  const newConversation = useStore((s) => s.newConversation)
  const undo = useStore((s) => s.undoLastToolActions)

  const [text, setText] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const sentRef = useRef(false)

  const messages = allMessages.filter((m) => m.conversationId === activeId)
  const title = conversations.find((c) => c.id === activeId)?.title ?? 'Кабанёнок'

  // авто-отправка реплики, пришедшей из карточки-приветствия
  useEffect(() => {
    const send = (location.state as { send?: string } | null)?.send
    if (send && !sentRef.current) {
      sentRef.current = true
      void sendMessage(send)
      navigate('.', { replace: true, state: null })
    }
  }, [location.state, navigate, sendMessage])

  // держим прокрутку у последнего сообщения
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, chatBusy, lastToolActions.length, activeId])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || chatBusy) return
    setText('')
    void sendMessage(t)
  }

  const empty = messages.length === 0 && !chatBusy

  return (
    <div className="flex flex-col gap-3 pb-28">
      {/* шапка с историей бесед */}
      <div className="sticky top-0 z-20 -mx-5 flex items-center gap-2 border-b border-white/5 bg-bg/85 px-5 py-3 backdrop-blur-xl">
        <button
          onClick={() => setListOpen(true)}
          aria-label="история бесед"
          className="tap flex h-9 w-9 items-center justify-center text-muted"
        >
          <MessageSquareText size={20} />
        </button>
        <div className="min-w-0 flex-1 truncate text-center font-semibold text-text">{title}</div>
        <button
          onClick={() => newConversation()}
          aria-label="новый чат"
          className="tap flex h-9 w-9 items-center justify-center text-muted"
        >
          <SquarePen size={20} />
        </button>
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-3 px-4 pt-10 text-center">
          <img src="/logo.png" alt="" className="h-16 w-16 rounded-3xl" />
          <h1 className="text-lg font-bold text-text">Привет, я Кабанёнок 💜</h1>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Твой персональный помощник. Расскажи, как прошёл день — я пойму, поддержу и сам
            отмечу его в календаре.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((m) =>
            m.role === 'user' ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[82%] self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-white"
              >
                {m.content}
              </motion.div>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex max-w-[88%] flex-col gap-1.5 self-start"
              >
                <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2.5 text-sm leading-relaxed text-text">
                  {m.content}
                </div>
                {m.toolResult && (
                  <div className="flex items-center gap-1.5 pl-1 text-[11px] text-muted">
                    <Check size={12} className="text-lavender" /> {m.toolResult}
                  </div>
                )}
              </motion.div>
            ),
          )}

          {chatBusy && (
            <div className="flex items-center gap-1.5 self-start rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-muted"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          )}

          {lastToolActions.length > 0 && (
            <div className="flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-bg/60 px-3 py-2 text-xs text-muted">
              <Check size={13} className="shrink-0 text-lavender" />
              <span className="flex-1">{lastToolActions.map((a) => a.label).join(', ')}</span>
              <button
                onClick={() => void undo()}
                className="tap flex items-center gap-1 font-semibold text-lavender"
              >
                <RotateCcw size={12} /> отменить
              </button>
            </div>
          )}

          {chatError && (
            <div className="self-center px-4 text-center text-xs text-drank">{chatError}</div>
          )}
        </div>
      )}

      <div ref={bottomRef} />

      <form
        onSubmit={submit}
        className="fixed inset-x-0 z-30 mx-auto flex max-w-md items-center gap-2 px-4"
        style={{ bottom: 'calc(var(--tabbar-h) + var(--sab) + 8px)' }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Напиши Кабанёнку…"
          className="min-w-0 flex-1 rounded-full border border-white/10 bg-surface px-4 py-3 text-text shadow-lg outline-none transition-colors placeholder:text-muted focus:border-primary/60"
        />
        <button
          type="submit"
          disabled={!text.trim() || chatBusy}
          aria-label="отправить"
          className="tap flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-opacity disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </form>

      <ConversationsSheet open={listOpen} onClose={() => setListOpen(false)} />
    </div>
  )
}
