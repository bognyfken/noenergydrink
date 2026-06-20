import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

/** Ловит ошибки рендера, чтобы вместо белого экрана показать дружелюбную заглушку. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary]', error)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="app-shell items-center justify-center px-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="" className="h-16 w-16 rounded-2xl opacity-90" />
          <h1 className="text-lg font-bold text-text">Что-то пошло не так</h1>
          <p className="text-sm text-muted">
            Данные в безопасности. Попробуй перезапустить приложение.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="tap rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-bold text-white shadow-lg shadow-primary/30"
          >
            Перезапустить
          </button>
        </div>
      </div>
    )
  }
}
