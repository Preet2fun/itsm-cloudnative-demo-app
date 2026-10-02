// src/copilot/useCopilot.ts
//
// Ports Hearth Dashboard.dc.html's Component class (lines 460-542): the
// default-conversation seed, push/respond/send, and resolveApproval's
// three confirmation messages. The DC's freeform() LLM-call path is
// replaced with the fixed fallback message — per DASHBOARD_COPILOT.md,
// real LLM calls are explicitly "Not built yet."

import { useCallback, useEffect, useRef, useState } from 'react'
import { PROMPTS, type ScriptEntry } from './copilotScript'

export type MessageRole = 'user' | 'pending' | 'copilot'

export interface ThreadMessage {
  id: number
  role: MessageRole
  /** user, pending */
  text?: string
  /** copilot — a SCRIPT key */
  key?: string
  /** copilot — inline content (confirmations, the free-text fallback) */
  custom?: ScriptEntry
}

export type ApprovalDecision = 'approved' | 'dismissed'

const FALLBACK_TEXT =
  "We couldn't reach the analysis service just now. Try one of the suggested questions, which run on today's data directly."

function confirmationFor(key: string): ScriptEntry {
  if (key === 'payments_act') {
    return {
      stage: 'Act',
      p: ['Done. Capture retried and succeeded — $57.50 received for #ORD-4819. Failed payments today are now 2 ($84.50).'],
      actions: [{ label: 'Undo', next: null }],
    }
  }
  if (key === 'delivery_act_one') {
    return {
      stage: 'Act',
      p: [
        'Done. "Lasagne tray #2 — 11:30" is on the weekday prep list starting tomorrow. I\'ll report back on lunch delivery times after tomorrow\'s service.',
      ],
      actions: [{ label: 'Undo', next: null }],
    }
  }
  return {
    stage: 'Act',
    p: [
      'Done. Lasagne tray #2 is on the weekday prep list from tomorrow, and the lunch delivery quote is now 38 min between 12:15 and 1:45 PM.',
      "I'll report back on lunch delivery times after tomorrow's service.",
    ],
    actions: [{ label: 'Undo', next: null }],
  }
}

export function useCopilot() {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [draft, setDraft] = useState('')
  const [approvals, setApprovals] = useState<Record<number, ApprovalDecision>>({})
  const seq = useRef(0)
  const pendingTimer = useRef<ReturnType<typeof setTimeout>>()

  const nextId = () => ++seq.current

  const push = useCallback((...msgs: Omit<ThreadMessage, 'id'>[]) => {
    setMessages((prev) => [...prev, ...msgs.map((m) => ({ id: nextId(), ...m }))])
  }, [])

  useEffect(() => {
    push(
      { role: 'user', text: 'Why are deliveries delayed?' },
      { role: 'copilot', key: 'delivery' },
      { role: 'user', text: 'Yes' },
      { role: 'copilot', key: 'delivery_items' }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => clearTimeout(pendingTimer.current), [])

  const respond = useCallback(
    (key: string, userText?: string) => {
      if (userText) push({ role: 'user', text: userText })
      const pendingId = nextId()
      const pendingText = key === 'delivery_act' || key === 'payments_act' ? 'Preparing changes…' : 'Reading orders, menu, and payments…'
      setMessages((prev) => [...prev, { id: pendingId, role: 'pending', text: pendingText }])
      clearTimeout(pendingTimer.current)
      pendingTimer.current = setTimeout(() => {
        setMessages((prev) => [...prev.filter((m) => m.id !== pendingId), { id: nextId(), role: 'copilot', key }])
      }, 900)
    },
    [push]
  )

  const send = useCallback(
    (text: string) => {
      const t = text.trim()
      if (!t) return
      setDraft('')

      const hit = PROMPTS.find((p) => p.question.toLowerCase() === t.toLowerCase())
      if (hit) {
        respond(hit.key, t)
        return
      }

      push({ role: 'user', text: t })
      const pendingId = nextId()
      setMessages((prev) => [...prev, { id: pendingId, role: 'pending', text: 'Thinking…' }])
      clearTimeout(pendingTimer.current)
      pendingTimer.current = setTimeout(() => {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== pendingId),
          { id: nextId(), role: 'copilot', custom: { stage: 'Explain', p: [FALLBACK_TEXT] } },
        ])
      }, 900)
    },
    [push, respond]
  )

  const resolveApproval = useCallback(
    (msgId: number, key: string, decision: ApprovalDecision) => {
      setApprovals((prev) => ({ ...prev, [msgId]: decision }))
      if (decision === 'approved') {
        push({ role: 'copilot', custom: confirmationFor(key) })
      }
    },
    [push]
  )

  const newThread = useCallback(() => {
    clearTimeout(pendingTimer.current)
    setMessages([])
    setApprovals({})
  }, [])

  return { messages, draft, setDraft, approvals, respond, send, resolveApproval, newThread }
}
