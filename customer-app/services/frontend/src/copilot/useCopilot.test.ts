import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useCopilot } from './useCopilot'

describe('useCopilot', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pre-seeds the delivery deep-dive conversation on mount', () => {
    const { result } = renderHook(() => useCopilot())
    expect(result.current.messages).toHaveLength(4)
    expect(result.current.messages[0]).toMatchObject({ role: 'user', text: 'Why are deliveries delayed?' })
    expect(result.current.messages[1]).toMatchObject({ role: 'copilot', key: 'delivery' })
    expect(result.current.messages[2]).toMatchObject({ role: 'user', text: 'Yes' })
    expect(result.current.messages[3]).toMatchObject({ role: 'copilot', key: 'delivery_items' })
  })

  it('walks the DASHBOARD_COPILOT.md reference conversation through to an approved change', () => {
    const { result } = renderHook(() => useCopilot())

    act(() => {
      result.current.respond('delivery_recommend', 'What should I do about it?')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    expect(result.current.messages.at(-1)).toMatchObject({ role: 'copilot', key: 'delivery_recommend' })

    act(() => {
      result.current.respond('delivery_act', 'Go ahead and make those changes')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const approvalMessage = result.current.messages.at(-1)!
    expect(approvalMessage).toMatchObject({ role: 'copilot', key: 'delivery_act' })

    act(() => {
      result.current.resolveApproval(approvalMessage.id, 'delivery_act', 'approved')
    })

    expect(result.current.approvals[approvalMessage.id]).toBe('approved')
    const confirmation = result.current.messages.at(-1)!
    expect(confirmation.role).toBe('copilot')
    expect(confirmation.custom?.p[0]).toContain('Lasagne tray #2 is on the weekday prep list')
  })

  it('a free-text miss shows the fixed fallback message, never a network call', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.send('What is the weather in Antarctica?')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const last = result.current.messages.at(-1)!
    expect(last.role).toBe('copilot')
    expect(last.custom?.p[0]).toContain("couldn't reach the analysis service")
  })

  it('a free-text question matching a starter prompt case-insensitively runs that prompt', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.send('WHY ARE DELIVERIES TAKING LONGER TODAY?')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const last = result.current.messages.at(-1)!
    expect(last).toMatchObject({ role: 'copilot', key: 'delivery' })
  })

  it('newThread clears messages and approvals', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.newThread()
    })
    expect(result.current.messages).toHaveLength(0)
    expect(result.current.approvals).toEqual({})
  })

  it('dismissing an approval records the decision without pushing a confirmation message', () => {
    const { result } = renderHook(() => useCopilot())
    act(() => {
      result.current.respond('payments_act', 'Retry #ORD-4819 capture')
    })
    act(() => {
      vi.advanceTimersByTime(900)
    })
    const approvalMessage = result.current.messages.at(-1)!
    const lengthBefore = result.current.messages.length

    act(() => {
      result.current.resolveApproval(approvalMessage.id, 'payments_act', 'dismissed')
    })

    expect(result.current.approvals[approvalMessage.id]).toBe('dismissed')
    expect(result.current.messages).toHaveLength(lengthBefore)
  })
})
