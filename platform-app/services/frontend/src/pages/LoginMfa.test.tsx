import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginMfa from './LoginMfa'
import * as api from '@/lib/api'
import * as auth from '@/lib/auth'

const mockNavigate = vi.fn()
let mockLocationState: unknown = { sessionId: 'sess-abc', email: 'alice.admin@globaltech.io' }

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  }
})

function renderMfa() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginMfa />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('LoginMfa page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockLocationState = { sessionId: 'sess-abc', email: 'alice.admin@globaltech.io' }
  })

  it('redirects to /login if there is no sessionId in router state', () => {
    mockLocationState = null
    renderMfa()
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
  })

  it('renders 6 digit inputs and a verify button when sessionId is present', () => {
    renderMfa()
    expect(screen.getAllByRole('textbox')).toHaveLength(6)
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument()
  })

  it('submits the entered code and stores the token on success', async () => {
    vi.spyOn(api.authApi, 'mfaVerify').mockResolvedValue({
      token: 'jwt-token-here',
      expires_at: '2026-07-10T00:00:00Z',
      user: { id: 'u1', email: 'alice.admin@globaltech.io', full_name: 'Alice Admin', role: 'admin', is_active: true, created_at: '', updated_at: '' },
    })
    const setTokenSpy = vi.spyOn(auth, 'setToken')

    renderMfa()
    const boxes = screen.getAllByRole('textbox')
    ;['1', '2', '3', '4', '5', '6'].forEach((digit, i) => {
      fireEvent.change(boxes[i], { target: { value: digit } })
    })
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))

    await waitFor(() => {
      expect(setTokenSpy).toHaveBeenCalledWith('jwt-token-here')
      expect(mockNavigate).toHaveBeenCalledWith('/welcome')
    })
  })

  it('shows an error on wrong code and does not navigate', async () => {
    vi.spyOn(api.authApi, 'mfaVerify').mockRejectedValue(new api.ApiError(401, 'invalid code'))

    renderMfa()
    const boxes = screen.getAllByRole('textbox')
    ;['0', '0', '0', '0', '0', '0'].forEach((digit, i) => {
      fireEvent.change(boxes[i], { target: { value: digit } })
    })
    fireEvent.click(screen.getByRole('button', { name: /verify/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid code/i)).toBeInTheDocument()
    })
  })

  it('calls mfaSend automatically on mount, and again on Resend click', async () => {
    const mfaSendSpy = vi.spyOn(api.authApi, 'mfaSend').mockResolvedValue({ status: 'sent' })

    renderMfa()
    await waitFor(() => expect(mfaSendSpy).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByText(/resend/i))
    await waitFor(() => expect(mfaSendSpy).toHaveBeenCalledTimes(2))
  })
})
