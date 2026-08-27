import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './Login'
import * as api from '@/lib/api'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockNavigate = vi.fn()

function renderLogin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Login page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('renders email, password fields, and a sign-in button', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('you@company.com')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('does not render any SSO buttons', () => {
    renderLogin()
    expect(screen.queryByText(/okta/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/azure/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/google/i)).not.toBeInTheDocument()
  })

  it('navigates to /login/mfa with sessionId on successful submit', async () => {
    vi.spyOn(api.authApi, 'login').mockResolvedValue({ mfa_required: true, session_id: 'sess-abc' })

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'alice.admin@globaltech.io' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'Password1!' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login/mfa', {
        state: { sessionId: 'sess-abc', email: 'alice.admin@globaltech.io' },
      })
    })
  })

  it('shows an error message on invalid credentials', async () => {
    vi.spyOn(api.authApi, 'login').mockRejectedValue(new api.ApiError(401, 'invalid credentials'))

    renderLogin()
    fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'alice.admin@globaltech.io' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
