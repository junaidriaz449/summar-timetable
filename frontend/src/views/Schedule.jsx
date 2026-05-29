import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import toast from 'react-hot-toast'
import { getKid } from '../api/kids'
import { getTasks } from '../api/tasks'
import { getDailyLog, markComplete, unmarkComplete } from '../api/dailyLog'
import TaskCard from '../components/TaskCard'
import PointsCounter from '../components/PointsCounter'
import BottomNav from '../components/BottomNav'

const CATEGORY_LABELS = {
  prayer: '🕌 Prayer',
  quran: '📖 Quran',
  chore: '🧹 Chores',
  play: '🏃 Play',
  screen: '📺 Screen Time',
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function Schedule() {
  const { kidId } = useParams()
  const navigate = useNavigate()
  const [kid, setKid] = useState(null)
  const [tasks, setTasks] = useState([])
  const [logs, setLogs] = useState([])   // array of DailyLogOut
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [toggling, setToggling] = useState(new Set())

  const load = useCallback(async () => {
    const [k, t, l] = await Promise.all([
      getKid(Number(kidId)),
      getTasks(null),
      getDailyLog(Number(kidId), todayStr()),
    ])
    setKid(k)
    const filtered = t.filter(task =>
      task.age_group === 'both' || task.age_group === String(k.age)
    )
    setTasks(filtered)
    setLogs(l)
    setLoading(false)
  }, [kidId])

  useEffect(() => { load() }, [load])

  const completedIds = new Set(logs.map(l => l.task_id))
  const totalPossible = tasks.reduce((s, t) => s + t.points, 0)
  const pointsEarned = tasks
    .filter(t => completedIds.has(t.id))
    .reduce((s, t) => s + t.points, 0)

  useEffect(() => {
    if (tasks.length > 0 && completedIds.size === tasks.length) {
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }, [logs.length, tasks.length])

  async function handleToggle(task, isCompleted) {
    if (toggling.has(task.id)) return
    setToggling(prev => new Set(prev).add(task.id))

    if (isCompleted) {
      const log = logs.find(l => l.task_id === task.id)
      // Optimistic remove
      setLogs(prev => prev.filter(l => l.task_id !== task.id))
      try {
        await unmarkComplete(log.id)
      } catch {
        setLogs(prev => [...prev, log])
      }
    } else {
      // Optimistic add
      const fake = { id: -task.id, kid_id: Number(kidId), task_id: task.id, date: todayStr(), completed_at: new Date().toISOString() }
      setLogs(prev => [...prev, fake])
      try {
        const real = await markComplete({ kid_id: Number(kidId), task_id: task.id, date: todayStr() })
        setLogs(prev => prev.map(l => l.id === fake.id ? real : l))
        toast.success(`+${task.points} pts! 🎉`)
      } catch {
        setLogs(prev => prev.filter(l => l.id !== fake.id))
      }
    }

    setToggling(prev => { const s = new Set(prev); s.delete(task.id); return s })
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="text-5xl animate-bounce">⏳</span>
    </div>
  )

  const grouped = {}
  tasks.forEach(t => {
    if (!grouped[t.category]) grouped[t.category] = []
    grouped[t.category].push(t)
  })

  return (
    <div className="min-h-screen pb-nav">
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      {/* Header */}
      <div
        style={{ backgroundColor: kid.color_theme + '22', borderBottom: `3px solid ${kid.color_theme}` }}
        className="px-4 pt-8 pb-4"
      >
        <button onClick={() => navigate('/')} className="text-gray-400 dark:text-gray-500 font-bold text-sm mb-2">← Back</button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{kid.avatar_emoji}</span>
          <div>
            <h1 className="text-xl font-black text-gray-800 dark:text-gray-100">{kid.name}'s Day</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
              {new Date().toLocaleDateString('en-PK', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Earned</p>
            <p className="text-2xl font-black" style={{ color: kid.color_theme }}>
              <PointsCounter value={pointsEarned} /> / {totalPossible}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 bg-white/60 dark:bg-gray-700/60 rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: kid.color_theme }}
            animate={{ width: `${totalPossible ? (pointsEarned / totalPossible) * 100 : 0}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Tasks */}
      <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto">
        {Object.entries(grouped).map(([category, categoryTasks]) => (
          <div key={category}>
            <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 pl-1">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="space-y-2">
              {categoryTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  completed={completedIds.has(task.id)}
                  onToggle={handleToggle}
                  disabled={toggling.has(task.id)}
                />
              ))}
            </div>
          </div>
        ))}

        {completedIds.size === tasks.length && tasks.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-center py-8"
          >
            <p className="text-5xl mb-2">🏆</p>
            <p className="text-2xl font-black text-forest">Perfect Day!</p>
            <p className="text-gray-500 dark:text-gray-400 font-semibold">All tasks complete! Amazing work!</p>
          </motion.div>
        )}
      </div>

      <BottomNav kidId={kidId} />
    </div>
  )
}
