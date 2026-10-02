// src/copilot/CopilotMessage.tsx
import Icon from '@/components/Icon'
import Button from '@/components/Button'
import AnswerBlock from './AnswerBlock'
import { SCRIPT } from './copilotScript'
import type { ThreadMessage, ApprovalDecision } from './useCopilot'
import styles from './CopilotMessage.module.css'

interface CopilotMessageProps {
  message: ThreadMessage
  isLast: boolean
  approval?: ApprovalDecision
  onReply: (next: string, label: string) => void
  onAction: (next: string | null, label: string) => void
  onApprove: (msgId: number) => void
  onDismiss: (msgId: number) => void
}

export default function CopilotMessage({ message, isLast, approval, onReply, onAction, onApprove, onDismiss }: CopilotMessageProps) {
  if (message.role === 'user') {
    return <div className={styles.userBubble}>{message.text}</div>
  }

  if (message.role === 'pending') {
    return (
      <div className={styles.pending}>
        <Icon name="loader" size={14} />
        <span>{message.text}</span>
      </div>
    )
  }

  const entry = message.custom ?? (message.key ? SCRIPT[message.key] : undefined)
  if (!entry) return null

  const replies = isLast ? entry.replies ?? [] : []
  const actions = entry.actions ?? []

  return (
    <div className={styles.answer}>
      <div className={styles.stageRow}>
        <Icon name="sparkles" size={14} />
        <span>Copilot</span>
      </div>

      {entry.p.map((text, i) => (
        <p key={i} className={styles.paragraph}>
          {text}
        </p>
      ))}

      {(entry.blocks ?? []).map((block, i) => (
        <AnswerBlock
          key={i}
          block={block}
          approvalDecision={block.type === 'approval' ? approval : undefined}
          onApprove={() => onApprove(message.id)}
          onDismiss={() => onDismiss(message.id)}
        />
      ))}

      {entry.p2 && <p className={styles.paragraph}>{entry.p2}</p>}

      {actions.length > 0 && (
        <div className={styles.actionsRow}>
          {actions.map((a) => (
            <Button key={a.label} variant="secondary" size="sm" onClick={() => onAction(a.next, a.label)}>
              {a.label}
            </Button>
          ))}
        </div>
      )}

      {replies.length > 0 && (
        <div className={styles.repliesRow}>
          {replies.map((r) => (
            <button key={r.label} className={styles.replyChip} onClick={() => onReply(r.next, r.label)}>
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
