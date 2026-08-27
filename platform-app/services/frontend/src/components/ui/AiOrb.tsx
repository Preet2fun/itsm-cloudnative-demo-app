import { Icon } from './Icon'

interface AiOrbProps {
  size?: number
  active?: boolean
}

export function AiOrb({ size = 28, active = false }: AiOrbProps) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--ai-grad)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        boxShadow: active ? 'var(--shadow-glow)' : 'none',
        flexShrink: 0,
      }}
    >
      <Icon name="sparkles" size={Math.round(size * 0.56)} fill />
    </span>
  )
}
