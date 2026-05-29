import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getKids } from '../api/kids'
import BottomNav from '../components/BottomNav'

export default function Home() {
  const [kids, setKids] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getKids().then(setKids).finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen pb-nav">
      {/* Header */}
      <div className="text-center pt-10 pb-6 px-4">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl font-black text-forest leading-tight"
        >
          ☀️ Summer Timetable
        </motion.h1>
        <p className="text-gray-500 dark:text-gray-400 font-semibold mt-1">Who's playing today?</p>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
          <span className="text-5xl animate-bounce">⏳</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 px-4 max-w-2xl mx-auto">
          {kids.map((kid, i) => (
            <motion.button
              key={kid.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(`/schedule/${kid.id}`)}
              style={{ borderColor: kid.color_theme }}
              className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-md border-4 p-6 text-left"
            >
              <div className="text-6xl mb-3 text-center">{kid.avatar_emoji}</div>
              <h2 className="text-2xl font-black text-center text-gray-800 dark:text-gray-100">{kid.name}</h2>
              <p className="text-center text-gray-400 dark:text-gray-500 font-semibold text-sm mb-4">Age {kid.age}</p>

              <div className="flex justify-between items-center">
                <div className="text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Today</p>
                  <p className="text-2xl font-black" style={{ color: kid.color_theme }}>
                    {kid.points_today} pts
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Streak</p>
                  <p className="text-2xl font-black text-orange-500">
                    {kid.current_streak > 0 ? `🔥 ${kid.current_streak}` : '—'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Total</p>
                  <p className="text-2xl font-black text-forest">{kid.total_points}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
