import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { authApi } from './api'

describe('authApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login() posts credentials and returns mfa_required + session_id', async () => {
    const mockResponse = { mfa_required: true, session_id: 'abc-123' }
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const result = await authApi.login({
      email: 'alice.admin@globaltech.io',
      password: 'Password1!',
      tenant_slug: 'tenant_a',
    })

    expect(result).toEqual(mockResponse)
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/login'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('mfaSend() posts session_id', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'sent' }),
    })

    const result = await authApi.mfaSend({ session_id: 'abc-123' })

    expect(result).toEqual({ status: 'sent' })
    const [, opts] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(opts.body)).toEqual({ session_id: 'abc-123' })
  })

  it('mfaVerify() posts session_id + code and returns a token', async () => {
    const mockResponse = {
      token: 'jwt-token-here',
      expires_at: '2026-07-10T00:00:00Z',
      user: { id: 'u1', email: 'alice.admin@globaltech.io', full_name: 'Alice Admin', role: 'admin', is_active: true, created_at: '', updated_at: '' },
    }
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    })

    const result = await authApi.mfaVerify({ session_id: 'abc-123', code: '123456' })

    expect(result).toEqual(mockResponse)
  })

  it('mfaVerify() throws ApiError on 401', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid code' }),
    })

    await expect(authApi.mfaVerify({ session_id: 'abc-123', code: '000000' })).rejects.toThrow('invalid code')
  })
})
