import { Routes, Route } from 'react-router-dom'
import Home from './views/Home'
import Schedule from './views/Schedule'
import Rewards from './views/Rewards'
import Dashboard from './views/Dashboard'
import ParentPanel from './views/ParentPanel'
import { useTheme } from './ThemeContext'

export default function App() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <>
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="fixed top-3 right-3 z-50 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border-2 border-amber/30 dark:border-gray-600 flex items-center justify-center text-xl"
      >
        {isDark ? '☀️' : '🌙'}
      </button>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schedule/:kidId" element={<Schedule />} />
        <Route path="/rewards/:kidId" element={<Rewards />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parent" element={<ParentPanel />} />
      </Routes>
    </>
  )
}
