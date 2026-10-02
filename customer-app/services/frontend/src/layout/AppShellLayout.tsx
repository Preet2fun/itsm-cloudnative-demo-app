// src/layout/AppShellLayout.tsx
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import CopilotPanel from '@/copilot/CopilotPanel'
import { useCopilot } from '@/copilot/useCopilot'
import { PROMPTS } from '@/copilot/copilotScript'
import { useSessionStore } from '@/lib/session-store'
import styles from './AppShellLayout.module.css'

const LOCATIONS = ['Northside Trattoria', 'Harbourline Kitchen', 'Eastgate Counter']

export interface DashboardOutletContext {
  askCopilot: (key: string) => void
}

export default function AppShellLayout() {
  const navigate = useNavigate()
  const clearSession = useSessionStore((s) => s.clear)

  const [locationIdx, setLocationIdx] = useState(0)
  const [copilotOpen, setCopilotOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1200)
  const copilot = useCopilot()

  const askCopilot = (key: string) => {
    setCopilotOpen(true)
    const prompt = PROMPTS.find((p) => p.key === key)
    copilot.respond(key, prompt?.question ?? '')
  }

  return (
    <div className={styles.shell}>
      <TopBar
        locationName={LOCATIONS[locationIdx]}
        locationNames={LOCATIONS}
        onLocationChange={(name) => setLocationIdx(Math.max(0, LOCATIONS.indexOf(name)))}
        copilotOpen={copilotOpen}
        onToggleCopilot={() => setCopilotOpen((v) => !v)}
        userName="Rosa Medina"
        onSignOut={() => {
          clearSession()
          navigate('/login')
        }}
      />
      <div className={styles.body}>
        <Sidebar activeId="dashboard" />
        <main className={styles.main}>
          <Outlet context={{ askCopilot } satisfies DashboardOutletContext} />
        </main>
        {copilotOpen && <CopilotPanel locationName={LOCATIONS[locationIdx]} copilot={copilot} onClose={() => setCopilotOpen(false)} />}
      </div>
    </div>
  )
}
