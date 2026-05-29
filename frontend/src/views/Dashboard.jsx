import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getWeeklyDashboard } from '../api/dashboard'
import BadgeChip from '../components/BadgeChip'
import BottomNav from '../components/BottomNav'

const CATEGORY_ICONS = {
  prayer: '🕌',
  quran: '📖',
  chore: '🧹',
  play: '🏃',
  screen: '📺',
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWeeklyDashboard().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="text-5xl animate-bounce">⏳</span>
    </div>
  )

  const { kids, week_start, week_end, leader_id, points_gap } = data
  const maxPoints = Math.max(...kids.map(k => k.week_points), 1)
  const isToday = new Date().getDay() === 0 // Sunday

  return (
    <div className="min-h-screen pb-nav">
      <div className="bg-forest px-4 pt-8 pb-6 text-center">
        <h1 className="text-2xl font-black text-white">⚔️ Battle Board ⚔️</h1>
        <p className="text-green-200 font-semibold text-sm mt-1">
          {new Date(week_start + 'T00:00:00').toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
          {' – '}
          {new Date(week_end + 'T00:00:00').toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Points comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-amber/20 dark:border-gray-700 p-4">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">This Week's Points</h2>
          <div className="space-y-4">
            {kids.map(kid => (
              <div key={kid.kid_id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-2xl">{kid.avatar_emoji}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-100 flex-1">{kid.name}</span>
                  <span className="font-black text-lg" style={{ color: kid.color_theme }}>
                    {kid.week_points} pts
                  </span>
                  {kid.kid_id === leader_id && kids.length > 1 && (
                    <span className="text-lg">👑</span>
                  )}
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(kid.week_points / maxPoints) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ backgroundColor: kid.color_theme }}
                    className="h-full rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Motivational message */}
          {points_gap > 0 && kids.length === 2 && (
            <p className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mt-3">
              {kids.find(k => k.kid_id !== leader_id)?.name} needs{' '}
              <span className="text-amber font-black">{points_gap} more pts</span> to catch up! 💪
            </p>
          )}
          {points_gap === 0 && kids.length === 2 && kids[0].week_points > 0 && (
            <p className="text-center text-sm font-black text-forest mt-3">🤝 It's a tie!</p>
          )}
        </div>

        {/* Streaks */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-amber/20 dark:border-gray-700 p-4">
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Streaks</h2>
          <div className="flex gap-4">
            {kids.map(kid => (
              <div key={kid.kid_id} className="flex-1 text-center">
                <span className="text-3xl">{kid.avatar_emoji}</span>
                <p className="font-bold text-gray-700 dark:text-gray-300 text-sm mt-1">{kid.name}</p>
                <p className="text-2xl font-black text-orange-500 mt-0.5">
                  {kid.current_streak > 0 ? `🔥 ${kid.current_streak}` : '—'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">best: {kid.longest_streak}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        {kids.map(kid => (
          <div key={kid.kid_id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-amber/20 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{kid.avatar_emoji}</span>
              <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {kid.name}'s Breakdown
              </h2>
            </div>
            {Object.keys(kid.category_breakdown).length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-2">No activity yet</p>
            ) : (
              <div className="space-y-1.5">
                {Object.entries(kid.category_breakdown).map(([cat, pts]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-lg w-7">{CATEGORY_ICONS[cat]}</span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 capitalize flex-1">{cat}</span>
                    <span className="font-black text-forest text-sm">{pts} pts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Badges */}
        {kids.map(kid => kid.badges_this_week.length > 0 && (
          <div key={`badges-${kid.kid_id}`} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-amber/20 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{kid.avatar_emoji}</span>
              <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {kid.name}'s Badges
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {kid.badges_this_week.map(b => (
                <BadgeChip key={b.id} badge={b} />
              ))}
            </div>
          </div>
        ))}

        {/* Weekly winner trophy */}
        {(isToday || points_gap > 50) && leader_id && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-amber/10 border-2 border-amber rounded-2xl p-6 text-center"
          >
            <p className="text-5xl mb-2">🏆</p>
            <p className="text-xl font-black text-amber-dark">
              {kids.find(k => k.kid_id === leader_id)?.name} is leading!
            </p>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
