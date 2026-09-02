 'use client'
import { useState } from 'react'

interface Props {
  childName: string
  childId: string
  onClose: () => void
}

export default function SleepCoach({ childName, childId, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'loading' | 'plan'>('form')
  const [plan, setPlan] = useState('')
  const [form, setForm] = useState({
    bedtime: '',
    wake_time: '',
    total_hours: '',
    night_wakings: '0',
    waking_duration: '0',
    nap1_time: '',
    nap1_duration: '',
    nap2_time: '',
    nap2_duration: '',
    child_mood: 'good',
  })

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #F0F0F0',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    background: 'white',
  }

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600,
    color: '#555',
    display: 'block',
    marginBottom: 6,
  }

  async function generatePlan() {
    setStep('loading')
    try {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ child_name: childName, child_id: childId, ...form })
      })
      const data = await res.json()
      setPlan(data.plan || 'Unable to generate plan. Please try again.')
      setStep('plan')
    } catch {
      setPlan('Something went wrong. Please try again.')
      setStep('plan')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#FFF9F5', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ width: 40, height: 4, background: '#E0D8D4', borderRadius: 99, margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2D2D2D' }}>
                🌙 Sleep Coach
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#888' }}>
                Tell me how {childName} slept. I'll suggest tonight's plan.
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '16px 24px 32px' }}>

          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Last night */}
              <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #F0EDED' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>Last Night</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>
                    <span style={labelStyle}>Bedtime</span>
                    <input type="time" value={form.bedtime} onChange={e => setForm({...form, bedtime: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Wake time</span>
                    <input type="time" value={form.wake_time} onChange={e => setForm({...form, wake_time: e.target.value})} style={inputStyle} />
                  </label>
                </div>
                <label style={{ marginTop: 12, display: 'block' }}>
                  <span style={labelStyle}>Total sleep hours</span>
                  <input type="number" min="0" max="20" step="0.5" placeholder="e.g. 10.5" value={form.total_hours} onChange={e => setForm({...form, total_hours: e.target.value})} style={inputStyle} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  <label>
                    <span style={labelStyle}>Night wakings</span>
                    <input type="number" min="0" max="20" value={form.night_wakings} onChange={e => setForm({...form, night_wakings: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Total awake (mins)</span>
                    <input type="number" min="0" value={form.waking_duration} onChange={e => setForm({...form, waking_duration: e.target.value})} style={inputStyle} />
                  </label>
                </div>
              </div>

              {/* Naps today */}
              <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #F0EDED' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>Today's Naps</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>
                    <span style={labelStyle}>Nap 1 time</span>
                    <input type="time" value={form.nap1_time} onChange={e => setForm({...form, nap1_time: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Nap 1 length (mins)</span>
                    <input type="number" min="0" placeholder="e.g. 45" value={form.nap1_duration} onChange={e => setForm({...form, nap1_duration: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Nap 2 time</span>
                    <input type="time" value={form.nap2_time} onChange={e => setForm({...form, nap2_time: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Nap 2 length (mins)</span>
                    <input type="number" min="0" placeholder="e.g. 60" value={form.nap2_duration} onChange={e => setForm({...form, nap2_duration: e.target.value})} style={inputStyle} />
                  </label>
                </div>
              </div>

              {/* Mood */}
              <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #F0EDED' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>How is {childName} today?</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { value: 'great', label: '😊 Great' },
                    { value: 'good', label: '🙂 Good' },
                    { value: 'tired', label: '😴 Tired' },
                    { value: 'cranky', label: '😤 Cranky' },
                    { value: 'exhausted', label: '😩 Exhausted' },
                  ].map(mood => (
                    <button
                      key={mood.value}
                      onClick={() => setForm({...form, child_mood: mood.value})}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 20,
                        border: form.child_mood === mood.value ? '2px solid #E07A5F' : '1.5px solid #F0EDED',
                        background: form.child_mood === mood.value ? '#FFF0E8' : 'white',
                        color: form.child_mood === mood.value ? '#E07A5F' : '#555',
                        fontSize: 13,
                        fontWeight: form.child_mood === mood.value ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generatePlan}
                style={{ width: '100%', padding: 16, background: '#E07A5F', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
              >
                🌙 Get Tonight's Sleep Plan
              </button>

              <p style={{ margin: 0, fontSize: 11, color: '#ccc', textAlign: 'center' }}>
                Not medical advice. Always consult your pediatrician for sleep concerns.
              </p>
            </div>
          )}

          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
              <p style={{ fontSize: 16, color: '#888', margin: 0 }}>Analyzing {childName}'s sleep...</p>
              <p style={{ fontSize: 13, color: '#ccc', marginTop: 8 }}>Creating a personalized plan</p>
            </div>
          )}

          {step === 'plan' && (
            <div>
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #E07A5F', marginBottom: 16 }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>
                  🌙 Tonight's Plan for {childName}
                </p>
                <p style={{ margin: 0, fontSize: 15, color: '#2D2D2D', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{plan}</p>
              </div>
              <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', margin: '0 0 16px' }}>
                Every child is different. Adjust based on what you know about {childName}.
              </p>
              <button
                onClick={() => setStep('form')}
                style={{ width: '100%', padding: 14, background: '#FFF0E8', color: '#E07A5F', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Log another day
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}