import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CompareBlock from './CompareBlock'
import BarsBlock from './BarsBlock'
import SparkBlock from './SparkBlock'
import ListBlock from './ListBlock'
import ApprovalBlock from './ApprovalBlock'

describe('Copilot answer blocks', () => {
  it('CompareBlock renders from/to values', () => {
    render(<CompareBlock rows={[{ label: 'Net sales', from: '$5,939', to: '$6,420', tone: 'up' }]} />)
    expect(screen.getByText('Net sales')).toBeInTheDocument()
    expect(screen.getByText('$5,939')).toBeInTheDocument()
    expect(screen.getByText('$6,420')).toBeInTheDocument()
  })

  it('BarsBlock renders label and value', () => {
    render(<BarsBlock rows={[{ label: 'Margherita', value: '34%', pct: 34 }]} />)
    expect(screen.getByText('Margherita')).toBeInTheDocument()
    expect(screen.getByText('34%')).toBeInTheDocument()
  })

  it('SparkBlock renders its stats', () => {
    render(<SparkBlock values={[1, 2, 3, 4]} stats={[{ label: 'Daily avg', value: '$5,880' }]} />)
    expect(screen.getByText('Daily avg')).toBeInTheDocument()
    expect(screen.getByText('$5,880')).toBeInTheDocument()
  })

  it('ListBlock renders numbered and warning marks', () => {
    render(<ListBlock rows={[{ mark: '1', label: 'Bake a second lasagne tray' }]} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Bake a second lasagne tray')).toBeInTheDocument()
  })

  it('ApprovalBlock shows Approve/Not now when pending, and calls the right handler', () => {
    const onApprove = vi.fn()
    const onDismiss = vi.fn()
    render(
      <ApprovalBlock
        rows={[{ mark: '1', label: 'Retry capture of $57.50 for #ORD-4819' }]}
        onApprove={onApprove}
        onDismiss={onDismiss}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Approve changes' }))
    expect(onApprove).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('ApprovalBlock shows a resolved badge instead of buttons once decided', () => {
    render(
      <ApprovalBlock
        rows={[{ mark: '1', label: 'Retry capture of $57.50 for #ORD-4819' }]}
        decision="approved"
        onApprove={() => {}}
        onDismiss={() => {}}
      />
    )
    expect(screen.getByText('Approved by Rosa · just now')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Approve changes' })).not.toBeInTheDocument()
  })
})
