import { NavLink } from 'react-router-dom'
import { CalendarDays, Flame, MessageCircleHeart, Trophy } from 'lucide-react'
import type { ComponentType } from 'react'

interface Tab {
  to: string
  label: string
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>
}

const TABS: Tab[] = [
  { to: '/', label: 'Сегодня', Icon: Flame },
  { to: '/calendar', label: 'Календарь', Icon: CalendarDays },
  { to: '/achievements', label: 'Награды', Icon: Trophy },
  { to: '/chat', label: 'Помощник', Icon: MessageCircleHeart },
]

export default function BottomTabBar() {
  return (
    <nav className="bottom-tabs fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-bg/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'tap flex h-[68px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  isActive ? 'text-lavender' : 'text-muted',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={23} strokeWidth={isActive ? 2.4 : 1.9} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
