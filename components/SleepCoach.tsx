'use client'
import { useState } from 'react'

interface Props {
  childName: string
  childId: string
  onClose: () => void
}

export default function SleepCoach({ childName, childId, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'loading' | 'plan' | 'feedback' | 'done'>('form')
  const [plan, setPlan] = useState('')
  const [logId, setLogId] = useState<number | null>(null)
  const [form, setForm] = useState({
    bedtime: '',
    wake_time: '',
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
    color: '#2D2D2D',
    WebkitAppearance: 'none' as any,
  }

  const labelStyle = {
    fontSize: 13,
    fontWeight: 600 as const,
    color: '#555',
    display: 'block' as const,
    marginBottom: 6,
  }

  // Calculate total sleep hours from bedtime and wake time
  function calcTotalHours(bedtime: string, wakeTime: string): number | null {
    if (!bedtime || !wakeTime) return null
    const [bh, bm] = bedtime.split(':').map(Number)
    const [wh, wm] = wakeTime.split(':').map(Number)
    let bedMins = bh * 60 + bm
    let wakeMins = wh * 60 + wm
    if (wakeMins <= bedMins) wakeMins += 24 * 60 // next day
    return Math.round((wakeMins - bedMins) / 6) / 10
  }

  async function generatePlan() {
    setStep('loading')
    const total_hours = calcTotalHours(form.bedtime, form.wake_time)
    try {
      const res = await fetch('/api/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_name: childName,
          child_id: childId,
          ...form,
          total_hours
        })
      })
      const data = await res.json()
      setPlan(data.plan || 'Unable to generate plan. Please try again.')
      setLogId(data.log_id || null)
      setStep('plan')
    } catch {
      setPlan('Something went wrong. Please try again.')
      setStep('plan')
    }
  }

  async function submitFeedback(outcome: string, notes?: string) {
    if (logId) {
      await fetch('/api/sleep', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: logId, outcome, outcome_notes: notes })
      })
    }
    setStep('done')
  }

  const moods = [
    { value: 'great', label: '🙂 Great' },
    { value: 'good', label: '😊 Good' },
    { value: 'tired', label: '😴 Tired' },
    { value: 'cranky', label: '😣 Cranky' },
    { value: 'exhausted', label: '🥱 Exhausted' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#FFF9F5', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ width: 40, height: 4, background: '#E0D8D4', borderRadius: 99, margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2D2D2D' }}>
                🌙 Tonight's Plan
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

          {/* FORM STEP */}
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
                    <span style={labelStyle}>Morning wake-up</span>
                    <input type="time" value={form.wake_time} onChange={e => setForm({...form, wake_time: e.target.value})} style={inputStyle} />
                  </label>
                </div>
                {form.bedtime && form.wake_time && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>
                    Total sleep: <strong style={{ color: '#2D2D2D' }}>{calcTotalHours(form.bedtime, form.wake_time)}h</strong>
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  <label>
                    <span style={labelStyle}>Night wakings</span>
                    <input type="number" min="0" max="20" value={form.night_wakings} onChange={e => setForm({...form, night_wakings: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Longest awake (mins)</span>
                    <input type="number" min="0" placeholder="e.g. 25" value={form.waking_duration} onChange={e => setForm({...form, waking_duration: e.target.value})} style={inputStyle} />
                  </label>
                </div>
              </div>

              {/* Naps today */}
              <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #F0EDED' }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>Today's Naps</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label>
                    <span style={labelStyle}>Nap 1 start</span>
                    <input type="time" value={form.nap1_time} onChange={e => setForm({...form, nap1_time: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Nap 1 length (mins)</span>
                    <input type="number" min="0" placeholder="e.g. 45" value={form.nap1_duration} onChange={e => setForm({...form, nap1_duration: e.target.value})} style={inputStyle} />
                  </label>
                  <label>
                    <span style={labelStyle}>Nap 2 start</span>
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
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>How does {childName} seem today?</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {moods.map(mood => (
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
                disabled={!form.bedtime || !form.wake_time}
                style={{
                  width: '100%', padding: 16, background: '#E07A5F', color: 'white',
                  border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700,
                  cursor: !form.bedtime || !form.wake_time ? 'not-allowed' : 'pointer',
                  opacity: !form.bedtime || !form.wake_time ? 0.6 : 1
                }}
              >
                🌙 Get Tonight's Sleep Plan
              </button>

              <p style={{ margin: 0, fontSize: 11, color: '#ccc', textAlign: 'center' }}>
                Sleep needs vary by child. This plan is a starting point, not medical advice. Consult your pediatrician for concerns.
              </p>
            </div>
          )}

          {/* LOADING STEP */}
          {step === 'loading' && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
              <p style={{ fontSize: 16, color: '#888', margin: 0 }}>Analyzing {childName}'s sleep...</p>
              <p style={{ fontSize: 13, color: '#ccc', marginTop: 8 }}>Creating a personalized plan for tonight</p>
            </div>
          )}

          {/* PLAN STEP */}
          {step === 'plan' && (
            <div>
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #E07A5F', marginBottom: 12 }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>
                  🌙 Tonight's Plan for {childName}
                </p>
                <p style={{ margin: 0, fontSize: 15, color: '#2D2D2D', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{plan}</p>
              </div>
              <p style={{ fontSize: 11, color: '#ccc', textAlign: 'center', margin: '0 0 16px' }}>
                Sleep needs vary by child. Adjust based on what you know about {childName}.
              </p>
              <button
                onClick={() => setStep('feedback')}
                style={{ width: '100%', padding: 14, background: '#FFF0E8', color: '#E07A5F', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
              >
                How did tonight go? →
              </button>
              <button
                onClick={() => setStep('form')}
                style={{ width: '100%', padding: 12, background: 'none', color: '#aaa', border: 'none', fontSize: 13, cursor: 'pointer' }}
              >
                Log another night
              </button>
            </div>
          )}

          {/* FEEDBACK STEP */}
          {step === 'feedback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2D2D2D' }}>
                How did tonight go for {childName}?
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                Your feedback helps personalize future plans.
              </p>
              {[
                { value: 'worked', label: '🙂 Worked well', desc: 'Settled around the suggested time' },
                { value: 'somewhat', label: '😐 Somewhat helpful', desc: 'Took a bit longer than expected' },
                { value: 'didnt_work', label: '😣 Didn\'t work', desc: 'Had a difficult night' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => submitFeedback(opt.value)}
                  style={{
                    padding: '14px 16px', borderRadius: 12, border: '1.5px solid #F0EDED',
                    background: 'white', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', flexDirection: 'column', gap: 2
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#2D2D2D' }}>{opt.label}</span>
                  <span style={{ fontSize: 12, color: '#aaa' }}>{opt.desc}</span>
                </button>
              ))}
              <button
                onClick={() => setStep('done')}
                style={{ padding: 12, background: 'none', color: '#aaa', border: 'none', fontSize: 13, cursor: 'pointer' }}
              >
                Skip
              </button>
            </div>
          )}

          {/* DONE STEP */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#2D2D2D', margin: '0 0 8px' }}>Thanks for the feedback!</p>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 24px' }}>
                AskNeer will use this to improve {childName}'s next sleep plan.
              </p>
              <button
                onClick={onClose}
                style={{ padding: '12px 28px', background: '#E07A5F', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}