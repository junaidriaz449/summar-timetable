import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { verifyPin, getSettings, updateSetting } from '../api/settings'
import { getKids } from '../api/kids'
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import { getRewards, createReward, updateReward, deleteReward, getRedemptions, updateRedemption } from '../api/rewards'
import { getDailyLog, markComplete, unmarkComplete } from '../api/dailyLog'
import { adjustPoints, resetWeeklyPoints } from '../api/points'
import PinEntry from '../components/PinEntry'
import BottomNav from '../components/BottomNav'

const TABS = ['Overview', 'Redemptions', 'Tasks', 'Rewards', 'Settings']
const CATEGORIES = ['prayer', 'quran', 'chore', 'play', 'screen']
const TIERS = ['snack', 'big']

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function ParentPanel() {
  const [authed, setAuthed] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [tab, setTab] = useState(0)

  // Data
  const [kids, setKids] = useState([])
  const [tasks, setTasks] = useState([])
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [settings, setSettings] = useState({})
  const [logs, setLogs] = useState({})  // { kidId: [logs] }

  // Forms
  const [newTask, setNewTask] = useState({ label: '', category: 'prayer', points: 5, age_group: 'both', icon_emoji: '✅' })
  const [newReward, setNewReward] = useState({ label: '', tier: 'snack', points_cost: 20, icon_emoji: '🎁' })
  const [adjustForm, setAdjustForm] = useState({})  // { kidId: { delta, reason } }
  const [newPin, setNewPin] = useState('')
  const [screenLimit, setScreenLimit] = useState('')

  async function handlePin(pin) {
    const { valid } = await verifyPin(pin)
    if (valid) {
      setAuthed(true)
      loadAll()
    } else {
      setPinError(true)
      setTimeout(() => setPinError(false), 2000)
    }
  }

  async function loadAll() {
    const [k, t, r, rd, s] = await Promise.all([
      getKids(), getTasks(), getRewards(), getRedemptions(), getSettings(),
    ])
    setKids(k)
    setTasks(t)
    setRewards(r)
    setRedemptions(rd)
    const sMap = {}
    s.forEach(x => { sMap[x.key] = x.value })
    setSettings(sMap)
    setScreenLimit(sMap.screen_time_limit_minutes || '60')

    const logMap = {}
    for (const kid of k) {
      logMap[kid.id] = await getDailyLog(kid.id, todayStr())
    }
    setLogs(logMap)
  }

  async function toggleTask(kid, task) {
    const kidLogs = logs[kid.id] || []
    const existing = kidLogs.find(l => l.task_id === task.id)
    if (existing) {
      await unmarkComplete(existing.id)
    } else {
      await markComplete({ kid_id: kid.id, task_id: task.id, date: todayStr() })
    }
    const updated = await getDailyLog(kid.id, todayStr())
    setLogs(prev => ({ ...prev, [kid.id]: updated }))
  }

  async function handleAdjust(kidId) {
    const { delta, reason } = adjustForm[kidId] || {}
    if (!delta || !reason) return toast.error('Enter delta and reason')
    await adjustPoints(kidId, { delta: Number(delta), reason })
    toast.success('Points adjusted!')
    loadAll()
    setAdjustForm(prev => ({ ...prev, [kidId]: { delta: '', reason: '' } }))
  }

  async function handleRedemption(id, status) {
    await updateRedemption(id, { status })
    toast.success(status === 'approved' ? 'Approved! ✅' : 'Rejected')
    const rd = await getRedemptions()
    setRedemptions(rd)
  }

  async function handleAddTask(e) {
    e.preventDefault()
    await createTask(newTask)
    toast.success('Task added!')
    const t = await getTasks()
    setTasks(t)
    setNewTask({ label: '', category: 'prayer', points: 5, age_group: 'both', icon_emoji: '✅' })
  }

  async function handleDeleteTask(id) {
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function handleAddReward(e) {
    e.preventDefault()
    await createReward(newReward)
    toast.success('Reward added!')
    const r = await getRewards()
    setRewards(r)
    setNewReward({ label: '', tier: 'snack', points_cost: 20, icon_emoji: '🎁' })
  }

  async function handleDeleteReward(id) {
    await deleteReward(id)
    setRewards(prev => prev.filter(r => r.id !== id))
  }

  async function savePin() {
    if (newPin.length !== 4) return toast.error('PIN must be 4 digits')
    await updateSetting({ key: 'parent_pin', value: newPin })
    toast.success('PIN updated!')
    setNewPin('')
  }

  async function saveScreenLimit() {
    await updateSetting({ key: 'screen_time_limit_minutes', value: screenLimit })
    toast.success('Screen limit saved!')
  }

  async function handleResetWeeklyPoints() {
    if (!confirm('Reset weekly points for all kids?')) return
    await resetWeeklyPoints()
    toast.success('Weekly points reset!')
    loadAll()
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 pb-nav px-4">
        <div className="text-center">
          <p className="text-5xl mb-3">🔐</p>
          <h1 className="text-2xl font-black text-forest">Parent Panel</h1>
          <p className="text-gray-500 dark:text-gray-400 font-semibold">Enter your PIN to continue</p>
        </div>
        <PinEntry onSubmit={handlePin} error={pinError} />
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-nav">
      <div className="bg-forest px-4 pt-8 pb-4">
        <h1 className="text-xl font-black text-white">🔐 Parent Panel</h1>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-bold border-b-2 transition-colors
              ${tab === i ? 'border-forest text-forest dark:text-green-400 dark:border-green-400' : 'border-transparent text-gray-400 dark:text-gray-500'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 max-w-2xl mx-auto space-y-4">

        {/* Tab 0: Overview */}
        {tab === 0 && kids.map(kid => {
          const kidLogs = logs[kid.id] || []
          const completedIds = new Set(kidLogs.map(l => l.task_id))
          const kidTasks = tasks.filter(t =>
            t.is_active && (t.age_group === 'both' || t.age_group === String(kid.age))
          )
          return (
            <div key={kid.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-amber/20 dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{kid.avatar_emoji}</span>
                <h2 className="font-black text-gray-800 dark:text-gray-100">{kid.name}</h2>
                <span className="ml-auto font-bold text-forest">{kid.total_points} pts</span>
              </div>
              <div className="space-y-1.5 mb-4">
                {kidTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(kid, task)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left
                      ${completedIds.has(task.id)
                        ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
                  >
                    <span>{task.icon_emoji}</span>
                    <span className={`flex-1 text-sm font-semibold ${completedIds.has(task.id) ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                      {task.label}
                    </span>
                    <span className="text-xs text-amber font-bold">{task.points}p</span>
                    {completedIds.has(task.id) && <span className="text-green-500">✓</span>}
                  </button>
                ))}
              </div>
              {/* Manual adjust */}
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="±pts"
                  value={adjustForm[kid.id]?.delta || ''}
                  onChange={e => setAdjustForm(p => ({ ...p, [kid.id]: { ...p[kid.id], delta: e.target.value } }))}
                  className="w-20 border-2 border-amber/30 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm font-bold"
                />
                <input
                  type="text"
                  placeholder="Reason"
                  value={adjustForm[kid.id]?.reason || ''}
                  onChange={e => setAdjustForm(p => ({ ...p, [kid.id]: { ...p[kid.id], reason: e.target.value } }))}
                  className="flex-1 border-2 border-amber/30 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm"
                />
                <button onClick={() => handleAdjust(kid.id)}
                  className="bg-forest text-white rounded-xl px-4 py-2 text-sm font-bold">
                  Adjust
                </button>
              </div>
            </div>
          )
        })}

        {/* Tab 1: Redemptions */}
        {tab === 1 && (
          <>
            {redemptions.filter(r => r.status === 'pending').length === 0 && (
              <p className="text-center text-gray-400 dark:text-gray-500 font-semibold py-8">No pending redemptions</p>
            )}
            {redemptions.filter(r => r.status === 'pending').map(r => {
              const kid = kids.find(k => k.id === r.kid_id)
              return (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 border-yellow-300 dark:border-yellow-600 p-4 flex items-center gap-3">
                  <span className="text-3xl">{r.reward?.icon_emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{r.reward?.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{kid?.avatar_emoji} {kid?.name} • {r.reward?.points_cost} pts</p>
                  </div>
                  <button onClick={() => handleRedemption(r.id, 'approved')}
                    className="bg-green-500 text-white rounded-xl px-3 py-2 text-sm font-bold">✅</button>
                  <button onClick={() => handleRedemption(r.id, 'rejected')}
                    className="bg-red-100 dark:bg-red-900 text-red-500 dark:text-red-400 rounded-xl px-3 py-2 text-sm font-bold">✗</button>
                </div>
              )
            })}
          </>
        )}

        {/* Tab 2: Manage Tasks */}
        {tab === 2 && (
          <>
            {tasks.map(task => (
              <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
                <span className="text-2xl">{task.icon_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{task.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{task.category} • {task.age_group} • {task.points}pts</p>
                </div>
                <button onClick={() => handleDeleteTask(task.id)}
                  className="text-red-400 font-bold text-sm px-2">✕</button>
              </div>
            ))}
            <form onSubmit={handleAddTask} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber/30 dark:border-gray-700 p-4 space-y-3">
              <h3 className="font-black text-gray-700 dark:text-gray-200">Add Task</h3>
              <input required placeholder="Label" value={newTask.label}
                onChange={e => setNewTask(p => ({ ...p, label: e.target.value }))}
                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <select value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={newTask.age_group} onChange={e => setNewTask(p => ({ ...p, age_group: e.target.value }))}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm">
                  <option value="both">Both</option>
                  <option value="6">Age 6</option>
                  <option value="8">Age 8</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input type="number" placeholder="Points" value={newTask.points}
                  onChange={e => setNewTask(p => ({ ...p, points: Number(e.target.value) }))}
                  className="w-24 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
                <input placeholder="Icon emoji" value={newTask.icon_emoji}
                  onChange={e => setNewTask(p => ({ ...p, icon_emoji: e.target.value }))}
                  className="w-24 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="w-full bg-forest text-white rounded-xl py-3 font-bold">Add Task</button>
            </form>
          </>
        )}

        {/* Tab 3: Manage Rewards */}
        {tab === 3 && (
          <>
            {rewards.map(reward => (
              <div key={reward.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-3">
                <span className="text-2xl">{reward.icon_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate">{reward.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{reward.tier} • {reward.points_cost}pts</p>
                </div>
                <button onClick={() => handleDeleteReward(reward.id)}
                  className="text-red-400 font-bold text-sm px-2">✕</button>
              </div>
            ))}
            <form onSubmit={handleAddReward} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber/30 dark:border-gray-700 p-4 space-y-3">
              <h3 className="font-black text-gray-700 dark:text-gray-200">Add Reward</h3>
              <input required placeholder="Label" value={newReward.label}
                onChange={e => setNewReward(p => ({ ...p, label: e.target.value }))}
                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
              <div className="flex gap-2">
                <select value={newReward.tier} onChange={e => setNewReward(p => ({ ...p, tier: e.target.value }))}
                  className="flex-1 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm">
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input type="number" placeholder="Cost" value={newReward.points_cost}
                  onChange={e => setNewReward(p => ({ ...p, points_cost: Number(e.target.value) }))}
                  className="w-24 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
                <input placeholder="Icon" value={newReward.icon_emoji}
                  onChange={e => setNewReward(p => ({ ...p, icon_emoji: e.target.value }))}
                  className="w-20 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="w-full bg-forest text-white rounded-xl py-3 font-bold">Add Reward</button>
            </form>
          </>
        )}

        {/* Tab 4: Settings */}
        {tab === 4 && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber/20 dark:border-gray-700 p-4 space-y-3">
              <h3 className="font-black text-gray-700 dark:text-gray-200">Change PIN</h3>
              <input type="password" maxLength={4} placeholder="New 4-digit PIN" value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
              <button onClick={savePin} className="w-full bg-forest text-white rounded-xl py-3 font-bold">Save PIN</button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-amber/20 dark:border-gray-700 p-4 space-y-3">
              <h3 className="font-black text-gray-700 dark:text-gray-200">Screen Time Limit</h3>
              <div className="flex gap-2 items-center">
                <input type="number" value={screenLimit}
                  onChange={e => setScreenLimit(e.target.value)}
                  className="w-24 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-xl px-3 py-2 text-sm" />
                <span className="text-sm text-gray-500 dark:text-gray-400 font-semibold">minutes/day</span>
                <button onClick={saveScreenLimit} className="ml-auto bg-forest text-white rounded-xl px-4 py-2 font-bold text-sm">Save</button>
              </div>
            </div>

            <button
              onClick={handleResetWeeklyPoints}
              className="w-full bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border-2 border-orange-200 dark:border-orange-800 rounded-2xl py-4 font-black">
              🔄 Reset Weekly Points
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
