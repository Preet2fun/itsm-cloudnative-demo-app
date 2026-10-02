// src/copilot/blocks/ApprovalBlock.tsx
import type { ApprovalRow } from '../copilotScript'
import Button from '@/components/Button'
import StatusBadge from '@/components/StatusBadge'
import type { ApprovalDecision } from '../useCopilot'
import styles from '../blocks.module.css'

interface ApprovalBlockProps {
  rows: ApprovalRow[]
  decision?: ApprovalDecision
  onApprove: () => void
  onDismiss: () => void
}

export default function ApprovalBlock({ rows, decision, onApprove, onDismiss }: ApprovalBlockProps) {
  return (
    <div className={styles.rows}>
      {rows.map((r, i) => (
        <div key={i} className={styles.approvalRow}>
          <span className={styles.approvalMark}>{r.mark}</span>
          <span>{r.label}</span>
        </div>
      ))}
      {!decision && (
        <div className={styles.approvalActions}>
          <Button variant="primary" size="sm" onClick={onApprove}>
            Approve changes
          </Button>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Not now
          </Button>
        </div>
      )}
      {decision && (
        <StatusBadge tone={decision === 'approved' ? 'success' : 'neutral'} dot>
          {decision === 'approved' ? 'Approved by Rosa · just now' : 'Dismissed'}
        </StatusBadge>
      )}
    </div>
  )
}
