type SegmentedOption = string | { value: string; label: string }

interface SegmentedProps {
  options: SegmentedOption[]
  value: string
  onChange: (value: string) => void
  size?: 'default' | 'sm'
}

export function Segmented({ options, value, onChange, size }: SegmentedProps) {
  return (
    <div
      className="tabs"
      style={{ background: 'var(--surface-2)', padding: 3, borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}
    >
      {options.map((o) => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return (
          <button
            key={v}
            className={`tab${value === v ? ' active' : ''}`}
            style={size === 'sm' ? { padding: '5px 10px', fontSize: 12 } : undefined}
            onClick={() => onChange(v)}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}
