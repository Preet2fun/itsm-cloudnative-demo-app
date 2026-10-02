// src/copilot/CopilotPanel.tsx
import { useEffect, useRef } from 'react'
import Icon from '@/components/Icon'
import Button from '@/components/Button'
import IconButton from '@/components/IconButton'
import Input from '@/components/Input'
import CopilotMessage from './CopilotMessage'
import { PROMPTS } from './copilotScript'
import type { useCopilot } from './useCopilot'
import styles from './CopilotPanel.module.css'

interface CopilotPanelProps {
  locationName: string
  copilot: ReturnType<typeof useCopilot>
  onClose: () => void
}

export default function CopilotPanel({ locationName, copilot, onClose }: CopilotPanelProps) {
  const { messages, draft, setDraft, approvals, respond, send, resolveApproval, newThread } = copilot
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const isEmpty = messages.length === 0

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <Icon name="sparkles" size={16} />
        <div className={styles.title}>Copilot</div>
        <div className={styles.headerActions}>
          <Button variant="ghost" size="sm" onClick={newThread}>
            New
          </Button>
          <IconButton label="Close Copilot" variant="ghost" size="sm" onClick={onClose}>
            <Icon name="panel-right-close" size={16} />
          </IconButton>
        </div>
      </div>

      <div ref={threadRef} className={styles.thread}>
        {isEmpty && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              I read today&apos;s orders, menu, deliveries, and payments for {locationName}. Ask what&apos;s happening,
              why, and what to do next.
            </p>
            <div className={styles.starterList}>
              {PROMPTS.map((p) => (
                <button key={p.key} className={styles.starterRow} onClick={() => respond(p.key, p.question)}>
                  <span className={styles.starterIcon}>
                    <Icon name={p.icon} size={16} />
                  </span>
                  <span className={styles.starterText}>
                    <span className={styles.starterArea}>{p.area}</span>
                    <span className={styles.starterQuestion}>{p.question}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <CopilotMessage
            key={m.id}
            message={m}
            isLast={i === messages.length - 1}
            approval={approvals[m.id]}
            onReply={(next, label) => respond(next, label)}
            onAction={(next, label) => {
              if (next) respond(next, label)
            }}
            onApprove={(msgId) => resolveApproval(msgId, m.key ?? '', 'approved')}
            onDismiss={(msgId) => resolveApproval(msgId, m.key ?? '', 'dismissed')}
          />
        ))}
      </div>

      <div className={styles.composer}>
        <div className={styles.composerRow}>
          <div className={styles.inputWrap}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  send(draft)
                }
              }}
              placeholder="Ask about sales, orders, menu, deliveries…"
              size="lg"
              aria-label="Ask Copilot"
            />
          </div>
          <IconButton label="Send" variant="primary" size="lg" disabled={!draft.trim()} onClick={() => send(draft)}>
            <Icon name="arrow-up" size={16} />
          </IconButton>
        </div>
        <div className={styles.hint}>Reads {locationName} data only. Changes always ask for your approval.</div>
      </div>
    </aside>
  )
}
