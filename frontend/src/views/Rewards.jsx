import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { getKid } from '../api/kids'
import { getRewards, getRedemptions, createRedemption } from '../api/rewards'
import RewardCard from '../components/RewardCard'
import PointsCounter from '../components/PointsCounter'
import BottomNav from '../components/BottomNav'

export default function Rewards() {
  const { kidId } = useParams()
  const navigate = useNavigate()
  const [kid, setKid] = useState(null)
  const [rewards, setRewards] = useState([])
  const [redemptions, setRedemptions] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [k, r, rd] = await Promise.all([
      getKid(Number(kidId)),
      getRewards(),
      getRedemptions(),
    ])
    setKid(k)
    setRewards(r)
    setRedemptions(rd.filter(x => x.kid_id === Number(kidId)))
    setLoading(false)
  }

  useEffect(() => { load() }, [kidId])

  async function handleRedeem(reward) {
    try {
      await createRedemption({ kid_id: Number(kidId), reward_id: reward.id })
      toast.success(`${reward.icon_emoji} Redemption requested!`)
      load()
    } catch {
      // error toast handled by axios interceptor
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <span className="text-5xl animate-bounce">⏳</span>
    </div>
  )

  const pendingIds = new Set(
    redemptions.filter(r => r.status === 'pending').map(r => r.reward_id)
  )
  const approvedIds = new Set(
    redemptions.filter(r => r.status === 'approved').map(r => r.reward_id)
  )
  const snacks = rewards.filter(r => r.tier === 'snack')
  const big = rewards.filter(r => r.tier === 'big')

  return (
    <div className="min-h-screen pb-nav">
      {/* Header */}
      <div
        style={{ backgroundColor: kid.color_theme + '22', borderBottom: `3px solid ${kid.color_theme}` }}
        className="px-4 pt-8 pb-5"
      >
        <button onClick={() => navigate('/')} className="text-gray-400 dark:text-gray-500 font-bold text-sm mb-2">← Back</button>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{kid.avatar_emoji}</span>
          <div>
            <h1 className="text-xl font-black text-gray-800 dark:text-gray-100">Rewards</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">{kid.name}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">Balance</p>
            <p className="text-2xl font-black" style={{ color: kid.color_theme }}>
              <PointsCounter value={kid.total_points} /> pts
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto">
        <section>
          <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">🍟 Snacks</h2>
          <div className="space-y-2">
            {snacks.map(r => (
              <RewardCard
                key={r.id}
                reward={r}
                balance={kid.total_points}
                onRedeem={handleRedeem}
                pendingIds={pendingIds}
                approvedIds={approvedIds}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">🎁 Big Rewards</h2>
          <div className="space-y-2">
            {big.map(r => (
              <RewardCard
                key={r.id}
                reward={r}
                balance={kid.total_points}
                onRedeem={handleRedeem}
                pendingIds={pendingIds}
                approvedIds={approvedIds}
              />
            ))}
          </div>
        </section>
      </div>

      <BottomNav kidId={kidId} />
    </div>
  )
}
