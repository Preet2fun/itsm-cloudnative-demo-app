const ICON_PATHS = {
  // Navigation
  grid:     "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  pulse:    "M3 12h4l2 6 4-14 2 8h6",
  alert:    "M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  ticket:   "M3 9V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z M9 5v14",
  problem:  "M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2ZM9 21h6M10 17v4M14 17v4",
  change:   "M3 7h13l-3-3M21 17H8l3 3",
  catalog:  "M3 5h18M3 12h18M3 19h18",
  cube:     "M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16ZM3.3 7 12 12l8.7-5M12 22V12",
  map:      "M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3ZM9 3v15M15 6v15",
  book:     "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5Z",
  chart:    "M3 3v18h18M7 15l4-5 3 3 5-7",
  gear:     "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z",
  // UI actions
  spark:    "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
  bolt:     "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  search:   "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  bell:     "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  plus:     "M12 5v14M5 12h14",
  check:    "M20 6 9 17l-5-5",
  checkCircle: "M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4 12 14.1l-3-3",
  x:        "M18 6 6 18M6 6l12 12",
  chevR:    "M9 18l6-6-6-6",
  chevD:    "M6 9l6 6 6-6",
  chevL:    "M15 18l-6-6 6-6",
  arrowR:   "M5 12h14M13 5l7 7-7 7",
  arrowUp:  "M12 19V5M5 12l7-7 7 7",
  arrowDown:"M12 5v14M19 12l-7 7-7-7",
  clock:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
  user:     "M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  users:    "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  db:       "M12 8c5 0 9-1.3 9-3s-4-3-9-3-9 1.3-9 3 4 3 9 3ZM3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3",
  cloud:    "M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 1 0 6 16h11.5Z",
  server:   "M3 4h18v6H3zM3 14h18v6H3zM7 7h.01M7 17h.01",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
  key:      "M15.5 7.5a3.5 3.5 0 1 1-4.9 4.2L4 18.3V21h2.7l.6-.6V18.7h1.7v-1.7h1.7l1.9-1.9a3.5 3.5 0 0 0 4.9-4.9Z",
  laptop:   "M3 5h18v11H3zM2 20h20",
  package:  "M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
  mail:     "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2ZM22 7l-10 6L2 7",
  wrench:   "M14.7 6.3a4 4 0 0 1-5.2 5.2L5 16v3h3l4.5-4.5a4 4 0 0 1 5.2-5.2l-2.5 2.5-2-2 2.5-2.5Z",
  link:     "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5",
  filter:   "M22 3H2l8 9.5V19l4 2v-8.5L22 3Z",
  send:     "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
  sparkles: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z",
  command:  "M18 3a3 3 0 0 0-3 3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3Z",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  dots:     "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  eye:      "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  flag:     "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1ZM4 22v-7",
  play:     "M5 3l14 9-14 9V3Z",
  refresh:  "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  globe:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z",
  lock:     "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM7 11V7a5 5 0 0 1 10 0v4",
  trend:    "M23 6l-9.5 9.5-5-5L1 18M17 6h6v6",
  moon:     "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  sun:      "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  topology: "M12 5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM5 22a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM19 22a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 5v6M12 11l-5.5 6M12 11l5.5 6",
  history:  "M3 3v5h5M3.05 13A9 9 0 1 0 6 5.3L3 8M12 7v5l4 2",
  doc:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6ZM14 2v6h6M9 13h6M9 17h6",
  star:     "M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1L12 2Z",
  thumbsUp: "M7 11v9H3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h4ZM7 11l4-9a3 3 0 0 1 3 3v3h5a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 17.6 21H7",
} as const

export type IconName = keyof typeof ICON_PATHS

interface IconProps {
  name: IconName
  size?: number
  stroke?: number
  fill?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 18, stroke = 2, fill = false, className = '', style = {} }: IconProps) {
  const d = ICON_PATHS[name] ?? ICON_PATHS.grid
  const segments = d.split(' M')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {segments.map((seg, i) => (
        <path key={i} d={i === 0 ? seg : 'M' + seg} />
      ))}
    </svg>
  )
}
