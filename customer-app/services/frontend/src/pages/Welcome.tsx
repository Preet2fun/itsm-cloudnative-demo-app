import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '@/lib/session-store'
import styles from './Welcome.module.css'

/**
 * Placeholder post-login landing — proves the auth flow works end to end.
 * The real Dashboard (screen 03 in design_handoff/design_handoff_hearth/)
 * is its own later roadmap task; do not build it out here.
 */
export default function Welcome() {
  const navigate = useNavigate()
  const email = useSessionStore((s) => s.email)
  const clearSession = useSessionStore((s) => s.clear)

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className="wordmark" style={{ fontSize: 'var(--text-heading-md-size)' }}>
          Hearth
        </span>
        <h1 className={styles.title}>You&apos;re signed in</h1>
        <p className={styles.body}>Signed in as {email}.</p>
        <p className={styles.note}>
          This is a placeholder landing page. The real dashboard is a later roadmap task —
          see customer-app/design_handoff/design_handoff_hearth/BUILD_PLAN.md, iteration 4.
        </p>
        <button
          type="button"
          className={styles.signOut}
          onClick={() => {
            clearSession()
            navigate('/login')
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
