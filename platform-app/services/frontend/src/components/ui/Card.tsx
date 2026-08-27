import type { ReactNode } from 'react'

interface CardProps {
  children?: ReactNode
  pad?: boolean
  className?: string
  style?: React.CSSProperties
}

interface CardHeaderProps {
  title: string
  children?: ReactNode
}

export function Card({ children, pad = false, className = '', style }: CardProps) {
  const cls = ['card', pad ? 'pad' : '', className].filter(Boolean).join(' ')
  return <div className={cls} style={style}>{children}</div>
}

export function CardHeader({ title, children }: CardHeaderProps) {
  return (
    <div className="card-h">
      <h3>{title}</h3>
      {children}
    </div>
  )
}
