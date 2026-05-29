import { motion } from 'framer-motion'

export default function RewardCard({ reward, balance, onRedeem, pendingIds, approvedIds }) {
  const canAfford = balance >= reward.points_cost
  const isPending = pendingIds.has(reward.id)
  const isApproved = approvedIds.has(reward.id)
  const needed = reward.points_cost - balance

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-2 p-4 flex items-center gap-4
      ${isPending ? 'border-yellow-400' : isApproved ? 'border-green-400' : 'border-amber/20 dark:border-gray-600'}`}>
      <span className="text-4xl flex-shrink-0">{reward.icon_emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 dark:text-gray-100">{reward.label}</p>
        <p className="text-amber font-bold text-sm">{reward.points_cost} pts</p>
        {!canAfford && !isPending && !isApproved && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Need {needed} more pts</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {isApproved ? (
          <span className="text-2xl">✅</span>
        ) : isPending ? (
          <span className="text-2xl">⏳</span>
        ) : (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => canAfford && onRedeem(reward)}
            disabled={!canAfford}
            className={`px-4 py-2 rounded-xl font-bold text-sm min-h-[44px]
              ${canAfford
                ? 'bg-forest text-white active:bg-green-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'}`}
          >
            Redeem
          </motion.button>
        )}
      </div>
    </div>
  )
}
