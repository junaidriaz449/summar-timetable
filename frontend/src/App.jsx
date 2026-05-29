import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './views/Home'
import Schedule from './views/Schedule'
import Rewards from './views/Rewards'
import Dashboard from './views/Dashboard'
import ParentPanel from './views/ParentPanel'
import { useTheme } from './ThemeContext'

function AppHeader() {
  const { isDark, toggleTheme } = useTheme()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const day = now.toLocaleDateString('en-US', { weekday: 'long' })
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
      <div className="relative flex items-center justify-center py-2">
        <h1 className="text-lg font-black text-forest">☀️ Summer Timetable</h1>
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="absolute right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-base"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
      <div className="flex items-center justify-center gap-3 pb-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {day}, {date}
        </span>
        <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
        <span className="text-xs font-bold text-forest tabular-nums">
          {time}
        </span>
      </div>
    </header>
  )
}

export default function App() {
  return (
    <>
      <AppHeader />
      <div className="pt-20">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/schedule/:kidId" element={<Schedule />} />
          <Route path="/rewards/:kidId" element={<Rewards />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/parent" element={<ParentPanel />} />
        </Routes>
      </div>
    </>
  )
}
