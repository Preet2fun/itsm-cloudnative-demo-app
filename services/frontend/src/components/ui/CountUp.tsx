import { useState, useEffect } from 'react'

interface CountUpProps {
  to: number
  dur?: number
  decimals?: number
  suffix?: string
}

export function CountUp({ to, dur = 900, decimals = 0, suffix = '' }: CountUpProps) {
  const [v, setV] = useState(0)

  useEffect(() => {
    setV(0)
    let raf: number
    const startTime = performance.now()

    const step = (now: number) => {
      const p = Math.min((now - startTime) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(to * eased)
      if (p < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [to, dur])

  return <span>{v.toFixed(decimals)}{suffix}</span>
}
