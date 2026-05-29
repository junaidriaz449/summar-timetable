import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

export default function PointsCounter({ value, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    const from = prevRef.current
    const to = value
    prevRef.current = value
    if (from === to) return

    const controls = animate(from, to, {
      duration: 0.6,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [value])

  return <span className={className}>{display}</span>
}
