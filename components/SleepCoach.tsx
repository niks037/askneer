'use client'
import { useState, useEffect } from 'react'

interface Props {
  childName: string
  childId: string
  onClose: () => void
}

interface SleepLog {
  id: number
  log_date: string
  night_wakings: number
  total_hours: number | null
}

export default function SleepCoach({ childName, childId, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'loading' | 'plan' | 'feedback' | 'done'>('form')
  const [plan, setPlan] = useState('')
  const [logId, setLogId] = useState<number | null>(null)
  const [wasAdjusted, setWasAdjusted] = useState(false)
  const [patternDetected, setPatternDetected] = useState(false)
  const [trendLogs, setTrendLogs] = useState<SleepLog[]>([])
  const [trendLoading, setTrendLoading] = useState(true)
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
    if (bedtime === wakeTime) return null // identical times can't represent a real sleep stretch
    const [bh, bm] = bedtime.split(':').map(Number)
    const [wh, wm] = wakeTime.split(':').map(Number)
    let bedMins = bh * 60 + bm
    let wakeMins = wh * 60 + wm
    if (wakeMins <= bedMins) wakeMins += 24 * 60 // next day
    const hours = Math.round((wakeMins - bedMins) / 6) / 10
    return hours > 16 ? null : hours // cap: no realistic single sleep stretch exceeds ~16h
  }

  useEffect(() => {
    async function fetchTrend() {
      try {
        const res = await fetch(`/api/sleep?child_name=${encodeURIComponent(childName)}`)
        const data = await res.json()
        // API returns most-recent-first; reverse so the chart reads left-to-right chronologically
        setTrendLogs((data.logs || []).slice(0, 7).reverse())
      } catch {
        setTrendLogs([])
      } finally {
        setTrendLoading(false)
      }
    }
    fetchTrend()
  }, [childName])

  function renderTrendChart() {
    if (trendLoading) return null
    if (trendLogs.length < 2) {
      return (
        <div style={{
          background: 'white', borderRadius: 14, padding: '14px 16px', border: '1px dashed #E8DDD5',
          marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
            {trendLogs.length === 0
              ? `Log tonight and we'll start tracking ${childName}'s sleep trend here.`
              : `One more night logged and we'll show ${childName}'s sleep trend here.`}
          </p>
        </div>
      )
    }

    const maxWakings = Math.max(...trendLogs.map(l => l.night_wakings ?? 0), 1)
    const barWidth = 28
    const gap = 10
    const chartHeight = 70
    const width = trendLogs.length * (barWidth + gap)

    const firstHalf = trendLogs.slice(0, Math.ceil(trendLogs.length / 2))
    const secondHalf = trendLogs.slice(Math.ceil(trendLogs.length / 2))
    const avg = (arr: SleepLog[]) => arr.length ? arr.reduce((s, l) => s + (l.night_wakings ?? 0), 0) / arr.length : 0
    const improving = avg(secondHalf) < avg(firstHalf)

    return (
      <div style={{ background: 'white', borderRadius: 14, padding: 16, border: '1px solid #F0EDED', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>
            {childName}'s Night Wakings
          </p>
          {trendLogs.length >= 4 && (
            <span style={{
              fontSize: 11.5, fontWeight: 700, padding: '3px 8px', borderRadius: 8,
              background: improving ? '#E8F5E9' : '#FFF0E8',
              color: improving ? '#2E7D32' : '#B5563A'
            }}>
              {improving ? '↓ Improving' : '— Watching'}
            </span>
          )}
        </div>
        <svg width="100%" height={chartHeight + 24} viewBox={`0 0 ${width} ${chartHeight + 24}`} preserveAspectRatio="xMinYMid meet">
          {trendLogs.map((log, i) => {
            const wakings = log.night_wakings ?? 0
            const barHeight = Math.max((wakings / maxWakings) * chartHeight, 4)
            const x = i * (barWidth + gap)
            const y = chartHeight - barHeight
            const dateLabel = log.log_date ? new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short' }) : ''
            return (
              <g key={log.id ?? i}>
                <rect x={x} y={y} width={barWidth} height={barHeight} rx={5} fill="#E07A5F" opacity={0.85} />
                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#2D2D2D">
                  {wakings}
                </text>
                <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle" fontSize="10" fill="#999">
                  {dateLabel}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  const [validationError, setValidationError] = useState('')

  async function generatePlan() {
    if (!form.bedtime || !form.wake_time) {
      setValidationError("Please enter both bedtime and morning wake-up time — these are needed to build tonight's plan.")
      return
    }
    if (calcTotalHours(form.bedtime, form.wake_time) === null) {
      setValidationError("Those times don't add up to a realistic night's sleep — please double-check bedtime and wake-up time.")
      return
    }
    setValidationError('')
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
      setWasAdjusted(!!data.wasAdjusted)
      setPatternDetected(!!data.patternDetected)
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

          {/* FORM STEP */}
          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {renderTrendChart()}

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
                  calcTotalHours(form.bedtime, form.wake_time) !== null ? (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#888' }}>
                      Total sleep: <strong style={{ color: '#2D2D2D' }}>{calcTotalHours(form.bedtime, form.wake_time)}h</strong>
                    </p>
                  ) : (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#C0392B', fontWeight: 600 }}>
                      ⚠️ Please double-check these times — they don't add up to a realistic night's sleep.
                    </p>
                  )
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

              {validationError && (
                <p style={{ margin: '0 0 -8px', fontSize: 12.5, color: '#C0392B', fontWeight: 600, textAlign: 'center' }}>
                  {validationError}
                </p>
              )}
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
              {(wasAdjusted || patternDetected) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {patternDetected && (
                    <div style={{
                      background: '#FFF0E8', border: '1px solid #F0C4A8', borderRadius: 10,
                      padding: '8px 12px', fontSize: 12.5, color: '#B5563A', fontWeight: 600
                    }}>
                      📊 We've noticed a pattern over the last few nights
                    </div>
                  )}
                  {wasAdjusted && (
                    <div style={{
                      background: '#EAF3FF', border: '1px solid #BFDBFE', borderRadius: 10,
                      padding: '8px 12px', fontSize: 12.5, color: '#2563A8', fontWeight: 600
                    }}>
                      🔄 Adjusted based on how last night's plan went
                    </div>
                  )}
                </div>
              )}
              <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1.5px solid #E07A5F', marginBottom: 12 }}>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#E07A5F', textTransform: 'uppercase', letterSpacing: 1 }}>
                    🌙 Sleep Coach — {childName}'s Plan
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
                onClick={() => { setWasAdjusted(false); setPatternDetected(false); setStep('form') }}
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