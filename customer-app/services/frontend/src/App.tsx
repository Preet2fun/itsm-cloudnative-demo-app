import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import LoginVerify from '@/pages/LoginVerify'
import Welcome from '@/pages/Welcome'
import { useSessionStore } from '@/lib/session-store'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useSessionStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/verify" element={<LoginVerify />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Welcome />
            </RequireAuth>
          }
        />
        {/* Later phases add Orders, Menu, Deliveries, Payments routes here,
            one at a time — see customer-app/design_handoff/CLAUDE.md */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
