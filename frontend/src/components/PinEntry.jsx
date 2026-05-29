import { useState } from 'react'
import { motion } from 'framer-motion'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function PinEntry({ onSubmit, error }) {
  const [pin, setPin] = useState('')

  function handleKey(k) {
    if (k === '⌫') {
      setPin(p => p.slice(0, -1))
    } else if (k !== '' && pin.length < 4) {
      const next = pin + k
      setPin(next)
      if (next.length === 4) {
        setTimeout(() => onSubmit(next), 100)
        setPin('')
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-4">
        {[0,1,2,3].map(i => (
          <div key={i}
            className={`w-5 h-5 rounded-full border-2 transition-colors
              ${i < pin.length ? 'bg-forest border-forest' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}
          />
        ))}
      </div>
      {error && <p className="text-red-500 font-bold text-sm -mt-4">Wrong PIN, try again</p>}
      <div className="grid grid-cols-3 gap-3 w-64">
        {KEYS.map((k, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.88 }}
            onClick={() => handleKey(k)}
            disabled={k === ''}
            className={`h-16 rounded-2xl font-bold text-xl shadow-sm
              ${k === '' ? 'invisible' : 'bg-white dark:bg-gray-800 border-2 border-amber/30 dark:border-gray-600 text-gray-800 dark:text-gray-100 active:bg-amber/10 dark:active:bg-gray-700'}`}
          >
            {k}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
