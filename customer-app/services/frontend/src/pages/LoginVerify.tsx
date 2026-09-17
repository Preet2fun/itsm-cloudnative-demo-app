import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import AuthLayout from './AuthLayout'
import { authApi } from '@/lib/api'
import { useSessionStore } from '@/lib/session-store'
import styles from './LoginVerify.module.css'

const RESEND_SECONDS = 30
const DIGIT_COUNT = 6

export default function LoginVerify() {
  const navigate = useNavigate()
  const sessionId = useSessionStore((s) => s.sessionId)
  const email = useSessionStore((s) => s.email)
  const completeVerify = useSessionStore((s) => s.completeVerify)
  const clearSession = useSessionStore((s) => s.clear)

  const [code, setCode] = useState<string[]>(Array(DIGIT_COUNT).fill(''))
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)
  const refs = useRef<Array<HTMLInputElement | null>>([])

  // No pending MFA session (direct nav, refresh after restart) — back to login.
  useEffect(() => {
    if (!sessionId) navigate('/login', { replace: true })
  }, [sessionId, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const verifyMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No pending session')
      const { token } = await authApi.mfaVerify({ session_id: sessionId, code: code.join('') })
      return token
    },
    onSuccess: (token) => {
      completeVerify(token)
      navigate('/', { replace: true })
    },
  })

  const resendMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No pending session')
      await authApi.mfaSend({ session_id: sessionId })
    },
    onSuccess: () => {
      setCode(Array(DIGIT_COUNT).fill(''))
      setCooldown(RESEND_SECONDS)
      refs.current[0]?.focus()
    },
  })

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '').slice(-1)
    setCode((prev) => {
      const next = prev.slice()
      next[i] = v
      return next
    })
    verifyMutation.reset()
    if (v && i < DIGIT_COUNT - 1) refs.current[i + 1]?.focus()
  }

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const complete = code.every(Boolean)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!complete) return
    verifyMutation.mutate()
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} className={styles.form}>
        <div className={styles.intro}>
          <h2 className={styles.title}>Enter your code</h2>
          <p className={styles.subtitle}>
            6-digit code sent to <span className={styles.subtitleEmail}>{email}</span>. It
            expires in 10 minutes.
          </p>
        </div>

        <div className={styles.codeRow}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              value={d}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className={[
                styles.digit,
                verifyMutation.isError ? styles.error : d ? styles.filled : '',
              ]
                .filter(Boolean)
                .join(' ')}
            />
          ))}
        </div>

        {verifyMutation.isError && (
          <div className={styles.errorBox}>That code didn&apos;t match. Check the code and try again.</div>
        )}

        <button type="submit" disabled={!complete || verifyMutation.isPending} className={styles.primary}>
          {verifyMutation.isPending ? 'Verifying…' : 'Verify and sign in'}
        </button>

        <div className={styles.footer}>
          <div className={styles.resendRow}>
            <span className={styles.resendLabel}>Didn&apos;t get it?</span>
            <button
              type="button"
              onClick={() => resendMutation.mutate()}
              disabled={cooldown > 0 || resendMutation.isPending}
              className={`tabular ${styles.resendButton}`}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession()
              navigate('/login')
            }}
            className={styles.restartButton}
          >
            Use a different account
          </button>
        </div>
      </form>
    </AuthLayout>
  )
}
