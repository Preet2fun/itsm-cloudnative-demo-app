// src/layout/TopBar.tsx
import { useState } from 'react'
import Button from '@/components/Button'
import IconButton from '@/components/IconButton'
import Icon from '@/components/Icon'
import styles from './TopBar.module.css'

interface TopBarProps {
  locationName: string
  locationNames: string[]
  onLocationChange: (name: string) => void
  copilotOpen: boolean
  onToggleCopilot: () => void
  userName: string
  onSignOut: () => void
}

export default function TopBar({
  locationName,
  locationNames,
  onLocationChange,
  copilotOpen,
  onToggleCopilot,
  userName,
  onSignOut,
}: TopBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <header className={styles.topbar}>
      <span className={`wordmark ${styles.wordmark}`}>Hearth</span>

      <div className={styles.locationPicker}>
        <button
          type="button"
          className={styles.locationButton}
          onClick={() => setPickerOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
        >
          {locationName}
          <Icon name="chevron-down" size={14} />
        </button>
        {pickerOpen && (
          <ul className={styles.locationList} role="listbox">
            {locationNames.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={name === locationName}
                  className={styles.locationOption}
                  onClick={() => {
                    onLocationChange(name)
                    setPickerOpen(false)
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.right}>
        <Button variant={copilotOpen ? 'secondary' : 'primary'} size="sm" onClick={onToggleCopilot}>
          <Icon name="sparkles" size={14} />
          {copilotOpen ? 'Hide Copilot' : 'Ask Copilot'}
        </Button>
        <span className={styles.userName}>{userName}</span>
        <IconButton label="Sign out" variant="secondary" onClick={onSignOut}>
          <Icon name="power" size={16} />
        </IconButton>
      </div>
    </header>
  )
}
