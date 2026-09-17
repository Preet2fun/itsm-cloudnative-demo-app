import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Login from './Login'
import * as api from '@/lib/api'
import { useSessionStore } from '@/lib/session-store'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockNavigate = vi.fn()

function renderLogin() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
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
    useSessionStore.getState().clear()
  })

  it('renders email, password fields, and a sign-in button — no SSO, no workspace field', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    expect(screen.queryByText(/okta/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/azure/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/workspace/i)).not.toBeInTheDocument()
  })

  it('logs in, sends the MFA code, and advances to /login/verify on success', async () => {
    const loginSpy = vi
      .spyOn(api.authApi, 'login')
      .mockResolvedValue({ mfa_required: true, session_id: 'sess-abc' })
    const mfaSendSpy = vi.spyOn(api.authApi, 'mfaSend').mockResolvedValue({ status: 'sent' })

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'rosa@northsidehospitality.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'correct-horse' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith({
        email: 'rosa@northsidehospitality.com',
        password: 'correct-horse',
      })
      expect(mfaSendSpy).toHaveBeenCalledWith({ session_id: 'sess-abc' })
      expect(mockNavigate).toHaveBeenCalledWith('/login/verify')
    })

    expect(useSessionStore.getState().sessionId).toBe('sess-abc')
    expect(useSessionStore.getState().email).toBe('rosa@northsidehospitality.com')
    expect(useSessionStore.getState().token).toBeNull()
  })

  it('shows a friendly error and does not navigate on invalid credentials', async () => {
    vi.spyOn(api.authApi, 'login').mockRejectedValue(new api.ApiError(401, 'invalid credentials'))

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'rosa@northsidehospitality.com' },
    })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))

    await waitFor(() => {
      expect(screen.getByText(/we couldn't sign you in with those details/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
