import { motion } from 'framer-motion'
import { useTheme } from '../ThemeContext'

export default function TaskCard({ task, completed, onToggle, disabled }) {
  const { isDark } = useTheme()

  const bgColor = completed
    ? (isDark ? '#052e16' : '#F0FDF4')
    : (isDark ? '#1f2937' : '#FFFFFF')

  return (
    <motion.button
      onClick={() => !disabled && onToggle(task, completed)}
      whileTap={{ scale: 0.96 }}
      animate={{ backgroundColor: bgColor }}
      transition={{ duration: 0.2 }}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl shadow-sm border-2 min-h-[64px] text-left
        ${completed ? 'border-green-400' : 'border-amber/30 dark:border-gray-600'}
        ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
    >
      <span className="text-3xl flex-shrink-0">{task.icon_emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base leading-tight ${completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
          {task.label}
        </p>
        <p className="text-sm text-amber font-semibold mt-0.5">+{task.points} pts</p>
      </div>
      <motion.div
        animate={completed ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
      >
        <span className="text-white text-lg">✓</span>
      </motion.div>
    </motion.button>
  )
}
