import { Route, Routes } from 'react-router-dom'
import BottomTabBar from './components/nav/BottomTabBar'
import AchievementToast from './components/achievements/AchievementToast'
import TodayScreen from './screens/TodayScreen'
import CalendarScreen from './screens/CalendarScreen'
import AchievementsScreen from './screens/AchievementsScreen'
import ChatScreen from './screens/ChatScreen'
import AuthScreen from './screens/AuthScreen'
import { useStore } from './lib/store'

export default function App() {
  const authReady = useStore((s) => s.authReady)
  const session = useStore((s) => s.session)

  if (!authReady) {
    return <div className="app-shell items-center justify-center text-muted">…</div>
  }

  if (!session) {
    return <AuthScreen />
  }

  return (
    <div className="app-shell">
      <main className="scroll-area no-scrollbar mx-auto w-full max-w-md px-5">
        <Routes>
          <Route path="/" element={<TodayScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
          <Route path="/achievements" element={<AchievementsScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
        </Routes>
      </main>
      <BottomTabBar />
      <AchievementToast />
    </div>
  )
}
