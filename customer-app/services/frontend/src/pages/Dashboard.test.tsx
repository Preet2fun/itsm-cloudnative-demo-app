import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AppShellLayout from '@/layout/AppShellLayout'
import Dashboard from './Dashboard'

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('Dashboard page', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  })

  it('renders the greeting, all four KPI tiles, and the pre-seeded Copilot thread', () => {
    renderDashboard()

    expect(screen.getByText('Good afternoon, Rosa')).toBeInTheDocument()
    expect(screen.getByText('Orders today')).toBeInTheDocument()
    expect(screen.getByText('Net sales')).toBeInTheDocument()
    expect(screen.getByText('Avg delivery')).toBeInTheDocument()
    expect(screen.getByText('Failed payments')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    expect(screen.getByText('Why are deliveries delayed?')).toBeInTheDocument()
  })

  it('renders the orders table and the deliveries/top-items cards', () => {
    renderDashboard()
    expect(screen.getByText('Orders in progress')).toBeInTheDocument()
    expect(screen.getByText('#ORD-4821')).toBeInTheDocument()
    expect(screen.getByText('Deliveries in flight')).toBeInTheDocument()
    expect(screen.getByText('Dani Okafor')).toBeInTheDocument()
    expect(screen.getByText('Top items today')).toBeInTheDocument()
    expect(screen.getAllByText('Margherita').length).toBeGreaterThan(0)
  })

  it('a Suggested action on the AI brief card opens the Copilot and asks that question', () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /Hide Copilot/ }))
    expect(screen.queryByRole('button', { name: 'Close Copilot' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Review failed payments' }))
    expect(screen.getByRole('button', { name: 'Close Copilot' })).toBeInTheDocument()
    expect(screen.getAllByText('Why have failed payments increased today?').length).toBeGreaterThan(0)
  })

  it('Sidebar nav items for unbuilt screens are present but disabled', () => {
    renderDashboard()
    const orders = screen.getByText('Orders')
    expect(orders.closest('span')).toHaveAttribute('aria-disabled', 'true')
    const dashboard = screen.getByText('Dashboard')
    expect(dashboard.closest('span')).not.toHaveAttribute('aria-disabled')
  })
})
