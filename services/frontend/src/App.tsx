import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DevComponents from '@/pages/DevComponents'

const THEME_KEY = 'synap-theme'

export default function App() {
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) ?? 'light') as 'light' | 'dark'
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dev/components" element={<DevComponents />} />
        {/* Sprint 1+ routes are added here as screens are built */}
        <Route path="*" element={<Navigate to="/dev/components" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
