'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show banner only after 30 seconds — let them have a good session first
      setTimeout(() => setShowBanner(true), 30000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      background: '#FFF9F5',
      border: '1px solid #E07A5F',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#333' }}>
          Add AskNeer to home screen
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#888', marginTop: '2px' }}>
          Quick access, feels like an app
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => setShowBanner(false)}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '13px' }}
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          style={{
            background: '#E07A5F',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Install
        </button>
      </div>
    </div>
  )
}