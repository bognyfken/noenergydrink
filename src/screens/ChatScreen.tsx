import { MessageCircleHeart } from 'lucide-react'

// Заглушка экрана ИИ-помощника. Полная реализация — этап 3
// (Qwen через Cerebras, function calling для записи заметок в дни).

export default function ChatScreen() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 pt-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
        <MessageCircleHeart size={38} className="text-lavender" />
      </div>
      <h1 className="text-xl font-bold text-text">Помощник скоро появится</h1>
      <p className="max-w-xs text-sm leading-relaxed text-muted">
        Здесь будет тёплый ИИ-собеседник: ему можно рассказать, как прошёл день,
        а он поддержит и сам запишет заметку в календарь. Добавим на следующем этапе.
      </p>
    </div>
  )
}
