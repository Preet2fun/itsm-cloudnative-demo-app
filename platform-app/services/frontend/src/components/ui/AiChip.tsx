import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface AiChipProps {
  children?: ReactNode
  confidence?: number
}

export function AiChip({ children, confidence }: AiChipProps) {
  return (
    <span className="badge ai" style={{ fontSize: 11 }}>
      <Icon name="sparkles" size={11} fill />
      {children}
      {confidence != null && (
        <span style={{ opacity: 0.85, fontWeight: 700 }}>· {confidence}%</span>
      )}
    </span>
  )
}
