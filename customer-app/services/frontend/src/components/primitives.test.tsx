import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'
import IconButton from './IconButton'
import Input from './Input'
import Icon from './Icon'

describe('core primitives', () => {
  it('Button renders its children and fires onClick', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Approve changes</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Approve changes' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('Button respects the disabled prop', () => {
    render(<Button disabled>Pause online orders</Button>)
    expect(screen.getByRole('button', { name: 'Pause online orders' })).toBeDisabled()
  })

  it('IconButton exposes its label as the accessible name', () => {
    render(
      <IconButton label="Close Copilot">
        <Icon name="panel-right-close" />
      </IconButton>
    )
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
  })

  it('Input reflects value changes', () => {
    const onChange = vi.fn()
    render(<Input aria-label="Ask Copilot" value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Ask Copilot'), { target: { value: 'Why are sales down?' } })
    expect(onChange).toHaveBeenCalled()
  })
})
