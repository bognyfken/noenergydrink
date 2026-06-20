import { useState } from 'react'
import { Check, MessageSquarePlus, Pencil, Trash2, X } from 'lucide-react'
import Sheet from './ui/Sheet'
import { useStore } from '../lib/store'

/** Шит истории чатов: список бесед с переключением, переименованием и удалением. */
export default function ConversationsSheet({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const conversations = useStore((s) => s.conversations)
  const activeId = useStore((s) => s.activeConversationId)
  const messages = useStore((s) => s.messages)
  const newConversation = useStore((s) => s.newConversation)
  const switchConversation = useStore((s) => s.switchConversation)
  const renameConversation = useStore((s) => s.renameConversation)
  const deleteConversation = useStore((s) => s.deleteConversation)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  function lastSnippet(convId: string): string {
    const msgs = messages.filter((m) => m.conversationId === convId)
    const last = msgs[msgs.length - 1]
    return last ? last.content.replace(/\s+/g, ' ').slice(0, 40) : 'Пустая беседа'
  }

  function startEdit(id: string, title: string) {
    setConfirmId(null)
    setEditingId(id)
    setDraft(title)
  }

  function saveEdit() {
    if (editingId) void renameConversation(editingId, draft)
    setEditingId(null)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Беседы">
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            newConversation()
            onClose()
          }}
          className="tap flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-white"
        >
          <MessageSquarePlus size={18} /> Новый чат
        </button>

        {conversations.length === 0 && (
          <p className="py-6 text-center text-sm text-muted">Пока нет бесед. Начни новую 💜</p>
        )}

        {conversations.map((c) => {
          const active = c.id === activeId

          if (editingId === c.id) {
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-2xl bg-bg/50 px-3 py-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit()
                  }}
                  className="min-w-0 flex-1 rounded-xl bg-surface-2 px-3 py-2 text-text outline-none"
                />
                <button onClick={saveEdit} aria-label="сохранить" className="tap text-lavender">
                  <Check size={18} />
                </button>
                <button onClick={() => setEditingId(null)} aria-label="отмена" className="tap text-muted">
                  <X size={18} />
                </button>
              </div>
            )
          }

          if (confirmId === c.id) {
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-2xl bg-drank/10 px-3 py-2.5">
                <span className="flex-1 text-sm text-text">Удалить беседу?</span>
                <button
                  onClick={() => {
                    void deleteConversation(c.id)
                    setConfirmId(null)
                  }}
                  className="tap rounded-xl bg-drank px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Удалить
                </button>
                <button onClick={() => setConfirmId(null)} className="tap px-2 text-sm text-muted">
                  Отмена
                </button>
              </div>
            )
          }

          return (
            <div
              key={c.id}
              className={[
                'flex items-center gap-1 rounded-2xl px-3 py-2',
                active ? 'bg-primary/20 ring-1 ring-primary/40' : 'bg-bg/50',
              ].join(' ')}
            >
              <button
                onClick={() => {
                  switchConversation(c.id)
                  onClose()
                }}
                className="tap flex min-w-0 flex-1 flex-col items-start py-1 text-left"
              >
                <span className="w-full truncate font-semibold text-text">{c.title}</span>
                <span className="w-full truncate text-xs text-muted">{lastSnippet(c.id)}</span>
              </button>
              <button
                onClick={() => startEdit(c.id, c.title)}
                aria-label="переименовать"
                className="tap flex h-9 w-9 items-center justify-center text-muted"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => {
                  setEditingId(null)
                  setConfirmId(c.id)
                }}
                aria-label="удалить"
                className="tap flex h-9 w-9 items-center justify-center text-muted"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
