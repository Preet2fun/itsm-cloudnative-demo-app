import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Icon, Button } from '@/components/ui'
import { authApi, ApiError } from '@/lib/api'
import styles from './Login.module.css'

const STATS: Array<[string, string]> = [
  ['96%', 'alert noise reduced'],
  ['41 min', 'median MTTR'],
  ['64%', 'auto-resolved'],
]

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      navigate('/login/mfa', { state: { sessionId: data.session_id, email } })
    },
    onError: (err: unknown) => {
      setError(err instanceof ApiError ? err.message : 'Something went wrong — please try again.')
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    loginMutation.mutate({ email, password })
  }

  return (
    <div className={styles.page}>
      <div className={styles.brandPanel}>
        <div className={styles.brandPanelGlow} />
        <div className={styles.brandPanelGrid} />
        <div className="row gap-2" style={{ alignItems: 'center', position: 'relative' }}>
          <Icon name="sparkles" size={22} fill />
          <span className="display" style={{ fontSize: 21, fontWeight: 700, letterSpacing: '-0.03em' }}>Synap</span>
        </div>

        <div className={styles.brandContent}>
          <div className="badge ai" style={{ marginBottom: 20, background: 'oklch(1 0 0 / 0.14)', color: '#fff' }}>
            <Icon name="sparkles" size={12} fill />The AI nervous system for IT
          </div>
          <h1 className="display" style={{ fontSize: 38, lineHeight: 1.08, margin: '0 0 14px', fontWeight: 600, letterSpacing: '-0.03em' }}>
            The nervous system of your enterprise.
          </h1>
          <p style={{ fontSize: 15.5, lineHeight: 1.55, color: 'oklch(1 0 0 / 0.72)', margin: 0 }}>
            Traditional ITSM is a fractured mess of slow tickets. Synap instantly routes ITOM alerts to automated fixes — so issues resolve themselves, while your team stays in control.
          </p>
          <div className={styles.statRow}>
            {STATS.map(([n, l]) => (
              <div key={l} className="col" style={{ gap: 2 }}>
                <div className="display" style={{ fontSize: 24, fontWeight: 700 }}>{n}</div>
                <div style={{ fontSize: 12, color: 'oklch(1 0 0 / 0.6)', whiteSpace: 'nowrap' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="row gap-2" style={{ position: 'relative', fontSize: 12.5, color: 'oklch(1 0 0 / 0.55)' }}>
          <Icon name="shield" size={14} /> SOC 2 Type II · ISO 27001 · GDPR-ready · Hosted on your Kubernetes
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formInner}>
          <h2 className="display" style={{ fontSize: 26, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Sign in to Synap</h2>
          <p className="muted" style={{ margin: '0 0 26px', fontSize: 14 }}>Welcome back. Let's get your operations running.</p>

          <form onSubmit={handleSubmit} className="col gap-3">
            <div>
              <label className="field-label" htmlFor="email">Work email</label>
              <input
                id="email"
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="spread" style={{ marginBottom: 6 }}>
                <label className="field-label" style={{ margin: 0 }} htmlFor="password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Forgot?</Link>
              </div>
              <input
                id="password"
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && <p className={styles.errorBanner}>{error}</p>}
            <Button type="submit" variant="primary" size="lg" block disabled={loginMutation.isPending} style={{ marginTop: 4 }}>
              {loginMutation.isPending ? (
                <span className="typing"><span /><span /><span /></span>
              ) : (
                <>Sign in <Icon name="arrowR" size={16} /></>
              )}
            </Button>
          </form>

          <div className="row gap-2 center" style={{ marginTop: 34, fontSize: 12, color: 'var(--faint)' }}>
            <Icon name="lock" size={12} /> Secured with end-to-end encryption
          </div>
        </div>
      </div>
    </div>
  )
}
