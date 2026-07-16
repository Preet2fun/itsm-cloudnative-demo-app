import { useNavigate } from 'react-router-dom'
import { Icon, Button } from '@/components/ui'
import { getEmail, logout } from '@/lib/auth'

export default function Welcome() {
  const navigate = useNavigate()
  const email = getEmail()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="col center" style={{ minHeight: '100vh', padding: 24, gap: 16 }}>
      <Icon name="checkCircle" size={40} />
      <h1 className="display" style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
        Welcome{email ? `, ${email}` : ''}
      </h1>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>
        App Shell is coming in Sprint 2 — you're logged in and your session is real.
      </p>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <Icon name="logout" size={15} /> Log out
      </Button>
    </div>
  )
}
