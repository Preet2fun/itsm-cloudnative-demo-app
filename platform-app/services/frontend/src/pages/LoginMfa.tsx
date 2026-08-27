import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Icon, Button } from '@/components/ui'
import { authApi, ApiError } from '@/lib/api'
import { setToken } from '@/lib/auth'

interface MfaLocationState {
  sessionId: string
  email: string
}

export default function LoginMfa() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as MfaLocationState | null

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const sendMutation = useMutation({ mutationFn: authApi.mfaSend })
  const verifyMutation = useMutation({
    mutationFn: authApi.mfaVerify,
    onSuccess: (data) => {
      setToken(data.token)
      navigate('/welcome')
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Something went wrong — please try again.')
    },
  })

  useEffect(() => {
    if (!state?.sessionId) {
      navigate('/login', { replace: true })
      return
    }
    sendMutation.mutate({ session_id: state.sessionId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!state?.sessionId) {
    return null
  }

  function handleDigitChange(index: number, value: string) {
    const char = value.slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleVerify() {
    setError(null)
    verifyMutation.mutate({ session_id: state!.sessionId, code: digits.join('') })
  }

  function handleResend() {
    setError(null)
    sendMutation.mutate({ session_id: state!.sessionId })
  }

  return (
    <div className="col center" style={{ minHeight: '100vh', padding: 24 }}>
      <div className="col" style={{ width: '100%', maxWidth: 384 }}>
        <Button variant="ghost" size="sm" style={{ alignSelf: 'flex-start', marginBottom: 18, paddingLeft: 4 }} onClick={() => navigate('/login')}>
          <Icon name="chevL" size={15} /> Back
        </Button>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="shield" size={22} />
        </div>
        <h2 className="display" style={{ fontSize: 24, fontWeight: 600, margin: '0 0 6px' }}>Two-factor authentication</h2>
        <p className="muted" style={{ margin: '0 0 24px', fontSize: 14 }}>
          Enter the code we emailed to <b style={{ color: 'var(--ink-2)' }}>{state.email}</b>.
        </p>
        <div className="row gap-2" style={{ justifyContent: 'space-between', marginBottom: 22 }}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              className="input mono"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              style={{ width: 50, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, padding: 0 }}
            />
          ))}
        </div>
        {error && <p style={{ color: 'var(--critical, #c0392b)', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <Button variant="primary" size="lg" block onClick={handleVerify} disabled={verifyMutation.isPending || digits.some((d) => !d)}>
          {verifyMutation.isPending ? <span className="typing"><span /><span /><span /></span> : 'Verify & continue'}
        </Button>
        <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 18 }}>
          Didn't get a code?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); handleResend() }} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Resend
          </a>
        </p>
      </div>
    </div>
  )
}
