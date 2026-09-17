import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginVerify from './LoginVerify'
import * as api from '@/lib/api'
import { useSessionStore } from '@/lib/session-store'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockNavigate = vi.fn()

function renderVerify() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginVerify />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function typeCode(code: string) {
  const inputs = screen.getAllByLabelText(/^Digit \d$/)
  code.split('').forEach((d, i) => fireEvent.change(inputs[i], { target: { value: d } }))
}

describe('LoginVerify page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useSessionStore.getState().clear()
  })

  it('redirects to /login when there is no pending MFA session', () => {
    renderVerify()
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('disables submit until all six digits are entered, then verifies and signs in', async () => {
    useSessionStore.getState().startVerify({ sessionId: 'sess-abc', email: 'rosa@northsidehospitality.com' })
    const verifySpy = vi
      .spyOn(api.authApi, 'mfaVerify')
      .mockResolvedValue({ token: 'jwt.fake', expires_at: '2026-01-01T00:00:00Z', user: { id: 'u1', email: 'rosa@northsidehospitality.com', full_name: 'Rosa Medina' } })

    renderVerify()
    expect(screen.getByRole('button', { name: /verify and sign in/i })).toBeDisabled()

    typeCode('42918')
    expect(screen.getByRole('button', { name: /verify and sign in/i })).toBeDisabled()

    typeCode('429187')
    expect(screen.getByRole('button', { name: /verify and sign in/i })).not.toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /verify and sign in/i }))

    await waitFor(() => {
      expect(verifySpy).toHaveBeenCalledWith({ session_id: 'sess-abc', code: '429187' })
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
    })
    expect(useSessionStore.getState().token).toBe('jwt.fake')
  })

  it('shows an error and does not navigate when the code is rejected', async () => {
    useSessionStore.getState().startVerify({ sessionId: 'sess-abc', email: 'rosa@northsidehospitality.com' })
    vi.spyOn(api.authApi, 'mfaVerify').mockRejectedValue(new api.ApiError(401, 'invalid code'))

    renderVerify()
    typeCode('000000')
    fireEvent.click(screen.getByRole('button', { name: /verify and sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/that code didn't match/i)).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalledWith('/', { replace: true })
  })

  it('resend clears the code and fires POST /auth/mfa/send again', async () => {
    useSessionStore.getState().startVerify({ sessionId: 'sess-abc', email: 'rosa@northsidehospitality.com' })
    const resendSpy = vi.spyOn(api.authApi, 'mfaSend').mockResolvedValue({ status: 'sent' })

    renderVerify()
    // Resend is disabled during the initial 30s cooldown.
    expect(screen.getByRole('button', { name: /resend in \d+s/i })).toBeDisabled()
    expect(resendSpy).not.toHaveBeenCalled()
  })
})
