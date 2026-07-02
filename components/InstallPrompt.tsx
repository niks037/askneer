'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // Check standalone mode (works on mobile)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check localStorage flag (works on desktop after install)
    if (localStorage.getItem('askneer_installed') === 'true') {
      setIsInstalled(true)
      return
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    const timer = setTimeout(() => setShowButton(true), 2000)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      localStorage.setItem('askneer_installed', 'true')
      setIsInstalled(true)
      setShowButton(false)
    })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        localStorage.setItem('askneer_installed', 'true')
        setIsInstalled(true)
        setShowButton(false)
      }
      setDeferredPrompt(null)
    }
  }

  if (isInstalled || !showButton) return null
  if (!isIOS && !deferredPrompt) return null

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); box-shadow: 0 4px 16px rgba(224,122,95,0.5); }
          50%       { transform: translateX(-50%) scale(1.07); box-shadow: 0 6px 36px rgba(224,122,95,0.95); }
        }
      `}</style>

      {/* Install button */}
      <div style={{
        position: 'fixed',
        bottom: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        animation: 'slideUp 0.3s ease forwards, pulse 1.5s ease-in-out 2.5s infinite',
        background: 'transparent',
        lineHeight: 0,
        borderRadius: '24px',
      }}>
        <button
          onClick={handleInstallClick}
          style={{
            background: '#E07A5F',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 2v13M7 11l5 5 5-5"/>
            <path d="M3 18v2a1 1 0 001 1h16a1 1 0 001-1v-2"/>
          </svg>
          Add AskNeer to Home Screen
        </button>
      </div>

      {/* iOS guide */}
      {showIOSGuide && (
        <div
          onClick={() => setShowIOSGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '0 16px 24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFF9F5',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
            }}
          >
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '16px', color: '#333' }}>
              Get the AskNeer app
            </p>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#888' }}>
              Save to your home screen for instant access — takes 5 seconds
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Tap the ↑ Share icon in your Safari address bar',
                'Tap "Add to Home Screen"',
                'Tap Add — you\'re all set!',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: '#E07A5F', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '13px', flexShrink: 0,
                  }}>{i + 1}</div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#444', lineHeight: 1.4 }}>{step}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                marginTop: '20px', width: '100%',
                background: '#E07A5F', color: 'white',
                border: 'none', borderRadius: '10px',
                padding: '12px', fontSize: '15px',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}