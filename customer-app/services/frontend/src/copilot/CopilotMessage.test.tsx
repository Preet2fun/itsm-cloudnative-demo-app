import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CopilotMessage from './CopilotMessage'
import type { ThreadMessage } from './useCopilot'

const noop = () => {}

describe('CopilotMessage', () => {
  it('renders a user message as a bubble', () => {
    const message: ThreadMessage = { id: 1, role: 'user', text: 'Why are deliveries delayed?' }
    render(<CopilotMessage message={message} isLast={false} onReply={noop} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.getByText('Why are deliveries delayed?')).toBeInTheDocument()
  })

  it('renders a pending message with its status text', () => {
    const message: ThreadMessage = { id: 2, role: 'pending', text: 'Reading orders, menu, and payments…' }
    render(<CopilotMessage message={message} isLast={false} onReply={noop} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.getByText('Reading orders, menu, and payments…')).toBeInTheDocument()
  })

  it('renders a scripted copilot answer: paragraphs, a block, and reply chips only when last', () => {
    const message: ThreadMessage = { id: 3, role: 'copilot', key: 'delivery' }
    const onReply = vi.fn()

    const { rerender } = render(
      <CopilotMessage message={message} isLast={true} onReply={onReply} onAction={noop} onApprove={noop} onDismiss={noop} />
    )
    expect(screen.getByText('Most delays happened between 12:30 and 1:30 PM.')).toBeInTheDocument()
    expect(screen.getByText('12:30–1:30 PM vs usual')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Yes'))
    expect(onReply).toHaveBeenCalledWith('delivery_items', 'Yes')

    rerender(<CopilotMessage message={message} isLast={false} onReply={onReply} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.queryByText('Yes')).not.toBeInTheDocument()
  })

  it('an approval block calls onApprove/onDismiss with the message id', () => {
    const message: ThreadMessage = { id: 4, role: 'copilot', key: 'payments_act' }
    const onApprove = vi.fn()
    render(<CopilotMessage message={message} isLast={true} onReply={noop} onAction={noop} onApprove={onApprove} onDismiss={noop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Approve changes' }))
    expect(onApprove).toHaveBeenCalledWith(4)
  })

  it('renders a custom (non-SCRIPT-key) copilot message, e.g. the free-text fallback', () => {
    const message: ThreadMessage = {
      id: 5,
      role: 'copilot',
      custom: { stage: 'Explain', p: ["We couldn't reach the analysis service just now."] },
    }
    render(<CopilotMessage message={message} isLast={true} onReply={noop} onAction={noop} onApprove={noop} onDismiss={noop} />)
    expect(screen.getByText("We couldn't reach the analysis service just now.")).toBeInTheDocument()
  })
})
