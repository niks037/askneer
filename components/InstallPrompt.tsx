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
  const [showIOSGuide, setShowIOSGuide] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Capture Android install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show iOS manual guide
      setShowIOSGuide(true)
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  // Don't show if already installed
  if (isInstalled) return null

  // Don't show on desktop if no install prompt available and not iOS
  if (!deferredPrompt && !isIOS) return null

  return (
    <>
      {/* Install button — fixed top right */}
      <button
        onClick={handleInstallClick}
        style={{
          position: 'fixed',
          top: '12px',
          right: '16px',
          background: '#E07A5F',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(224,122,95,0.4)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v13M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 18v2a1 1 0 001 1h16a1 1 0 001-1v-2" strokeLinecap="round"/>
        </svg>
        Add to Home Screen
      </button>

      {/* iOS guide popup */}
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
            <p style={{ margin: '0 0 16px', fontWeight: 700, fontSize: '16px', color: '#333' }}>
              Add AskNeer to Home Screen
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#E07A5F', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px', flexShrink: 0
                }}>1</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#444', lineHeight: 1.4 }}>
                  Tap the <strong>Share</strong> button at the bottom of Safari
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#E07A5F', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px', flexShrink: 0
                }}>2</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#444', lineHeight: 1.4 }}>
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#E07A5F', color: 'white', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '14px', flexShrink: 0
                }}>3</div>
                <p style={{ margin: 0, fontSize: '14px', color: '#444', lineHeight: 1.4 }}>
                  Tap <strong>Add</strong> — AskNeer will appear on your home screen
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                marginTop: '20px',
                width: '100%',
                background: '#E07A5F',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
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