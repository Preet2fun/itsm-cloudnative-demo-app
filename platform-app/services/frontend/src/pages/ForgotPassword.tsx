import { Link } from 'react-router-dom'
import { Icon, Button } from '@/components/ui'

export default function ForgotPassword() {
  return (
    <div className="col center" style={{ minHeight: '100vh', padding: 24 }}>
      <div className="col" style={{ width: '100%', maxWidth: 384 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Icon name="lock" size={22} />
        </div>
        <h2 className="display" style={{ fontSize: 24, fontWeight: 600, margin: '0 0 6px' }}>Reset your password</h2>
        <p className="muted" style={{ margin: '0 0 24px', fontSize: 14 }}>
          Password reset isn't available yet — contact your workspace admin for now.
        </p>
        <Link to="/login">
          <Button variant="ghost" size="sm" style={{ paddingLeft: 4 }}>
            <Icon name="chevL" size={15} /> Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  )
}
