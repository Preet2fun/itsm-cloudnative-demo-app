import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DevComponents from '@/pages/DevComponents'
import Login from '@/pages/Login'
import LoginMfa from '@/pages/LoginMfa'
import ForgotPassword from '@/pages/ForgotPassword'
import Welcome from '@/pages/Welcome'

const THEME_KEY = 'synap-theme'

export default function App() {
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) ?? 'light') as 'light' | 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/login/mfa" element={<LoginMfa />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/dev/components" element={<DevComponents />} />
        {/* Sprint 2+ routes are added here as screens are built */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
