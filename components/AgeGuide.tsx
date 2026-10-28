'use client'
import { useState, useEffect } from 'react'
import {
  MAX_MONTHS,
  AGE_PHASES,
  getPhaseForMonths,
  getNextPhase,
  formatAge,
} from '@/lib/ageGuide'

interface Props {
  initialMonths?: number
}

const card = {
  background: 'white',
  borderRadius: 16,
  padding: '18px 18px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  marginBottom: 14,
} as const

const h3 = { fontSize: 13, fontWeight: 700, color: '#E07A5F', margin: '0 0 10px', letterSpacing: 0.4, textTransform: 'uppercase' as const }

export default function AgeGuide({ initialMonths = 12 }: Props) {
  const [months, setMonths] = useState(
    Math.max(0, Math.min(MAX_MONTHS, Math.floor(initialMonths)))
  )
  const [copied, setCopied] = useState(false)

  const phase = getPhaseForMonths(months)
  const next = getNextPhase(phase)

  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('m', String(months))
      window.history.replaceState({}, '', url.toString())
    } catch {
      // ignore
    }
  }, [months])

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `What's normal at ${formatAge(months)}? A simple parent guide:`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AskNeer age guide', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // user cancelled share, nothing to do
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFF9F5', fontFamily: 'inherit', color: '#2D2D2D' }}>
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 18px 60px' }}>
        <a href="/" style={{ fontSize: 15, fontWeight: 800, color: '#E07A5F', textDecoration: 'none' }}>AskNeer</a>

        <h1 style={{ fontSize: 26, lineHeight: 1.2, margin: '14px 0 6px' }}>What&apos;s normal at this age?</h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: '#666', margin: '0 0 20px' }}>
          Move the slider to your child&apos;s age and see what is going on, why it happens and what helps.
        </p>

        {/* Age selector */}
        <div style={{ ...card, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>My child is</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2D2D2D', marginBottom: 12 }}>{formatAge(months)}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              aria-label="One month younger"
              onClick={() => setMonths(m => Math.max(0, m - 1))}
              style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: '#FFF0E8', color: '#E07A5F', fontSize: 22, cursor: 'pointer', flexShrink: 0 }}
            >−</button>
            <input
              type="range"
              min={0}
              max={MAX_MONTHS}
              value={months}
              onChange={e => setMonths(Number(e.target.value))}
              aria-label="Child's age in months"
              style={{ flex: 1, accentColor: '#E07A5F' }}
            />
            <button
              aria-label="One month older"
              onClick={() => setMonths(m => Math.min(MAX_MONTHS, m + 1))}
              style={{ width: 40, height: 40, borderRadius: 20, border: 'none', background: '#FFF0E8', color: '#E07A5F', fontSize: 22, cursor: 'pointer', flexShrink: 0 }}
            >+</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginTop: 4 }}>
            <span>Newborn</span><span>3 years</span>
          </div>
        </div>

        {/* Phase */}
        <div style={{ ...card, background: '#FFF0E8', boxShadow: 'none' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#E07A5F', letterSpacing: 0.4 }}>
            {phase.emoji} {phase.label.toUpperCase()}
          </div>
          <h2 style={{ fontSize: 22, margin: '6px 0 4px' }}>{phase.title}</h2>
          <p style={{ fontSize: 15, color: '#555', margin: 0, lineHeight: 1.5 }}>{phase.tagline}</p>
        </div>

        <div style={card}>
          <h3 style={h3}>What you may be seeing</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6 }}>
            {phase.seeing.map(s => <li key={s} style={{ marginBottom: 4 }}>{s}</li>)}
          </ul>
        </div>

        <div style={card}>
          <h3 style={h3}>Why it happens</h3>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{phase.why}</p>
        </div>

        <div style={card}>
          <h3 style={h3}>What tends to help</h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.6 }}>
            {phase.helps.map(s => <li key={s} style={{ marginBottom: 4 }}>{s}</li>)}
          </ul>
        </div>

        <div style={{ ...card, border: '2px dashed #F2C4B4', boxShadow: 'none' }}>
          <h3 style={h3}>Try this today</h3>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>{phase.tryToday}</p>
        </div>

        {next && (
          <button
            onClick={() => { setMonths(next.from); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{ ...card, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <div style={{ fontSize: 12, color: '#888', marginBottom: 2 }}>Coming next · {next.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#2D2D2D' }}>{next.emoji} {next.title} →</div>
          </button>
        )}

        {/* Share */}
        <button
          onClick={share}
          style={{ width: '100%', padding: '13px', background: 'white', border: '2px solid #F2C4B4', borderRadius: 12, fontSize: 15, fontWeight: 700, color: '#E07A5F', cursor: 'pointer', marginBottom: 14 }}
        >
          {copied ? 'Link copied ✓' : 'Share this with another parent'}
        </button>

        {/* CTA */}
        <div style={{ background: '#E07A5F', color: 'white', borderRadius: 18, padding: '22px 20px', marginTop: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.25, marginBottom: 8 }}>
            Want advice for your child, not just their age?
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: '0 0 14px', opacity: 0.95 }}>
            AskNeer remembers your child&apos;s name, age and story, so every answer fits them. Ask anything, free.
          </p>
          <a
            href={`/?src=guide&m=${months}`}
            style={{ display: 'block', textAlign: 'center', background: 'white', color: '#E07A5F', fontWeight: 800, fontSize: 15, padding: '13px', borderRadius: 12, textDecoration: 'none' }}
          >
            Try AskNeer free
          </a>
        </div>

        {/* Jump list */}
        <div style={{ marginTop: 26 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 8, letterSpacing: 0.4 }}>ALL AGE STAGES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AGE_PHASES.map(p => (
              <button
                key={p.id}
                onClick={() => { setMonths(p.from); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                style={{
                  padding: '7px 12px',
                  borderRadius: 16,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: p.id === phase.id ? '#E07A5F' : '#FFF0E8',
                  color: p.id === phase.id ? 'white' : '#E07A5F',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#999', lineHeight: 1.5, marginTop: 28 }}>
          This guide describes common patterns and is for information only. It is not medical advice. Every child develops at their own pace. If something worries you, please talk to your child&apos;s doctor.
        </p>
      </div>
    </div>
  )
}
