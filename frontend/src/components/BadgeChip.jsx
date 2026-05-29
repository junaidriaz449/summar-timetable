import { motion } from 'framer-motion'

export default function BadgeChip({ badge }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="inline-flex items-center gap-1.5 bg-amber/10 border border-amber/40 rounded-full px-3 py-1"
    >
      <span className="text-lg">{badge.badge_emoji}</span>
      <span className="text-xs font-bold text-amber-dark">{badge.badge_label}</span>
    </motion.div>
  )
}
