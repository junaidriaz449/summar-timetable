import { NavLink, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/',          label: 'Home',      icon: '🏠' },
  { to: '/dashboard', label: 'Battle',    icon: '⚔️' },
  { to: '/parent',    label: 'Parent',    icon: '🔐' },
]

export default function BottomNav({ kidId }) {
  const location = useLocation()

  const scheduleActive = location.pathname.startsWith('/schedule')
  const rewardsActive  = location.pathname.startsWith('/rewards')

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-amber/30 dark:border-gray-700 flex z-50"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs font-bold transition-colors
             ${isActive ? 'text-forest dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`
          }
        >
          <span className="text-2xl">{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}

      {kidId && (
        <>
          <NavLink
            to={`/schedule/${kidId}`}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs font-bold transition-colors
              ${scheduleActive ? 'text-forest dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <span className="text-2xl">📋</span>
            <span>Tasks</span>
          </NavLink>
          <NavLink
            to={`/rewards/${kidId}`}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] text-xs font-bold transition-colors
              ${rewardsActive ? 'text-forest dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}
          >
            <span className="text-2xl">🎁</span>
            <span>Rewards</span>
          </NavLink>
        </>
      )}
    </nav>
  )
}
