export interface Person {
  name?: string
  initials?: string
  color?: string
}

interface AvatarProps {
  person?: Person
  size?: number
}

export function Avatar({ person, size = 30 }: AvatarProps) {
  const p = person ?? {}
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.4, background: p.color ?? 'var(--accent)' }}
      title={p.name}
    >
      {p.initials}
    </span>
  )
}
