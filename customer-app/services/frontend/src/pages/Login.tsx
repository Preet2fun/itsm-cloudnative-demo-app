import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import AuthLayout from './AuthLayout'
import { authApi } from '@/lib/api'
import { useSessionStore } from '@/lib/session-store'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const startVerify = useSessionStore((s) => s.startVerify)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: async () => {
      // POST /api/v1/auth/login -> { session_id }
      const { session_id } = await authApi.login({ email, password })
      // POST /api/v1/auth/mfa/send — fires with no visible step of its own
      await authApi.mfaSend({ session_id })
      return session_id
    },
    onSuccess: (sessionId) => {
      startVerify({ sessionId, email })
      navigate('/login/verify')
    },
  })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthLayout>
      <form onSubmit={submit} className={styles.form}>
        <div className={styles.intro}>
          <h2 className={styles.title}>Sign in</h2>
          <p className={styles.subtitle}>We&apos;ll email a 6-digit code to confirm it&apos;s you.</p>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            className={styles.field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className={styles.field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {mutation.isError && (
          <div className={styles.errorBox}>
            We couldn&apos;t sign you in with those details. Check the email and password and
            try again.
          </div>
        )}

        <button type="submit" disabled={mutation.isPending} className={styles.primary}>
          {mutation.isPending ? 'Sending code…' : 'Continue'}
        </button>

        <div className={styles.footerRow}>
          <a href="#">Forgot password</a>
          <span className={styles.endpointHint}>POST /auth/login</span>
        </div>
      </form>
    </AuthLayout>
  )
}
