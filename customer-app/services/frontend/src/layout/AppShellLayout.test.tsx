import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useOutletContext } from 'react-router-dom'
import AppShellLayout, { type DashboardOutletContext } from './AppShellLayout'

function StubPage() {
  const { askCopilot } = useOutletContext<DashboardOutletContext>()
  return (
    <button type="button" onClick={() => askCopilot('delivery')}>
      Investigate delivery delays
    </button>
  )
}

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route path="/dashboard" element={<StubPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AppShellLayout', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 })
  })

  it('renders TopBar, Sidebar, the routed child, and the Copilot panel open by default at >=1200px', () => {
    renderShell()
    expect(screen.getByText('Hearth')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Orders')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
  })

  it('Ask/Hide Copilot in the TopBar toggles the panel', () => {
    renderShell()
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Hide Copilot/ }))
    expect(screen.queryByRole('button', { name: 'Close Copilot' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Ask Copilot/ }))
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
  })

  it('askCopilot (from the Outlet context) opens the panel and asks the given prompt', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: /Hide Copilot/ }))
    expect(screen.queryByRole('button', { name: 'Close Copilot' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Investigate delivery delays'))
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    expect(screen.getAllByText('Why are deliveries taking longer today?').length).toBeGreaterThan(0)
  })

  it('switching location updates the TopBar button and the Copilot hint text', () => {
    renderShell()
    expect(screen.getByRole('button', { name: /Northside Trattoria/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Northside Trattoria/ }))
    fireEvent.click(screen.getByRole('option', { name: 'Harbourline Kitchen' }))
    expect(screen.getByRole('button', { name: /Harbourline Kitchen/ })).toBeInTheDocument()
    expect(screen.getByText(/Reads Harbourline Kitchen data only/)).toBeInTheDocument()
  })
})
