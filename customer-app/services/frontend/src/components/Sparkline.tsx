// src/components/Sparkline.tsx
//
// Plain SVG polyline computed from min/max — same technique as
// platform-app's Synap UI Sparkline, no charting library.

interface SparklineProps {
  values: number[]
  width: number
  height: number
  color?: string
}

export default function Sparkline({ values, width, height, color = 'var(--info)' }: SparklineProps) {
  if (values.length < 2) return null

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const points = values.map((v, i): [number, number] => [
    (i / (values.length - 1)) * width,
    height - ((v - min) / range) * (height - 4) - 2,
  ])
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
