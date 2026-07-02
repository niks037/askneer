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
    // Already installed — never show button
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Show button after 2 seconds
    const timer = setTimeout(() => setShowButton(true), 2000)

    // Capture Android prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
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
      // iOS can't be programmatic — must show guide
      setShowIOSGuide(true)
      return
    }
    if (deferredPrompt) {
      // Android — directly triggers install, no extra steps
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setIsInstalled(true)
        setShowButton(false)
      }
      setDeferredPrompt(null)
    }
  }

  if (isInstalled || !showButton) return null

  return (
    <>
      {/* Bottom install button */}
      <div style={{
        position: 'fixed',
        bottom: '90px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        animation: 'slideUp 0.3s ease, pulse 2s ease-in-out 1s infinite',
       }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(224,122,95,0.4); }
          50%       { box-shadow: 0 4px 28px rgba(224,122,95,0.8); }
        }
      `}</style>
        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateX(-50%) translateY(20px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
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
            boxShadow: '0 4px 16px rgba(224,122,95,0.5)',
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

      {/* iOS only — minimal step guide since Apple forces manual install */}
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
              Add AskNeer to Home Screen
            </p>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#888' }}>
              Apple requires a manual step on iPhone — takes 5 seconds
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'Tap the Share button at the bottom of Safari',
                'Tap "Add to Home Screen"',
                'Tap Add — done!',
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