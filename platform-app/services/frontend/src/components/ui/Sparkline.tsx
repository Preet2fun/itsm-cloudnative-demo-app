import { useId } from 'react'

interface SparklineProps {
  data: number[]
  w?: number
  h?: number
  color?: string
  fill?: boolean
}

export function Sparkline({ data, w = 90, h = 28, color = 'var(--accent)', fill = true }: SparklineProps) {
  const uid = useId()
  const gid = `sg${uid.replace(/:/g, '')}`

  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - ((v - min) / rng) * (h - 4) - 2,
  ])
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]!.toFixed(1)} ${p[1]!.toFixed(1)}`).join(' ')
  const area = `${line} L${w} ${h} L0 ${h} Z`

  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
