import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CopilotPanel from './CopilotPanel'
import { useCopilot } from './useCopilot'

function Wrapper({ onClose = () => {} }: { onClose?: () => void }) {
  const copilot = useCopilot()
  return <CopilotPanel locationName="Northside Trattoria" copilot={copilot} onClose={onClose} />
}

describe('CopilotPanel', () => {
  it('renders the pre-seeded thread, not the empty state, on mount', () => {
    render(<Wrapper />)
    expect(screen.getByText('Why are deliveries delayed?')).toBeInTheDocument()
    expect(screen.queryByText(/I read today's orders/)).not.toBeInTheDocument()
  })

  it('New clears the thread back to the empty state with 10 starter questions', () => {
    render(<Wrapper />)
    fireEvent.click(screen.getByRole('button', { name: 'New' }))
    expect(screen.getByText(/I read today's orders, menu, deliveries, and payments for Northside Trattoria/)).toBeInTheDocument()
    expect(screen.getByText('How is my business performing today?')).toBeInTheDocument()
    expect(screen.getByText('What order volume should I expect this weekend?')).toBeInTheDocument()
  })

  it('Close Copilot calls onClose', () => {
    let closed = false
    render(<Wrapper onClose={() => (closed = true)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close Copilot' }))
    expect(closed).toBe(true)
  })

  it('the send button is disabled until the composer has text', () => {
    render(<Wrapper />)
    const sendButton = screen.getByRole('button', { name: 'Send' })
    expect(sendButton).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Ask Copilot'), { target: { value: 'Anything unusual happening today?' } })
    expect(sendButton).not.toBeDisabled()
  })
})
