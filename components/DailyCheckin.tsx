 
'use client'
import { useState } from 'react'

interface Props {
  childName: string
  childId: string
  onClose: () => void
  onComplete: () => void
}

export default function DailyCheckin({ childName, childId, onClose, onComplete }: Props) {
  const [mood, setMood] = useState('')
  const [sleepQuality, setSleepQuality] = useState(3)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const moods = [
    { value: 'great', label: '😊 Great' },
    { value: 'good', label: '🙂 Good' },
    { value: 'tired', label: '😴 Tired' },
    { value: 'cranky', label: '😤 Cranky' },
    { value: 'unwell', label: '🤒 Unwell' },
  ]

  async function save() {
    if (!mood) return
    setSaving(true)
    await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        child_name: childName,
        child_id: childId,
        mood,
        sleep_quality: sleepQuality,
        notes,
      })
    })
    setSaving(false)
    setDone(true)
    setTimeout(() => {
      onComplete()
      onClose()
    }, 1500)
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: '#FFF9F5', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '20px 24px 36px' }}>

        <div style={{ width: 40, height: 4, background: '#E0D8D4', borderRadius: 99, margin: '0 auto 20px' }} />

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✨</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2D2D2D', margin: 0 }}>
              Thanks! Check-in saved.
            </p>
            <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
              AskNeer will remember how {childName} is doing today.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#2D2D2D' }}>
                {greeting()}! 👋
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#888' }}>
                Quick check-in for {childName} — takes 10 seconds.
              </p>
            </div>

            {/* Mood */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#555' }}>
                How is {childName} today?
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {moods.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      border: mood === m.value ? '2px solid #E07A5F' : '1.5px solid #F0EDED',
                      background: mood === m.value ? '#FFF0E8' : 'white',
                      color: mood === m.value ? '#E07A5F' : '#555',
                      fontSize: 13,
                      fontWeight: mood === m.value ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sleep quality */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#555' }}>
                How did {childName} sleep last night?
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setSleepQuality(star)}
                    style={{
                      fontSize: 28,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: star <= sleepQuality ? 1 : 0.25,
                      padding: 0,
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: '#aaa' }}>
                {sleepQuality === 1 ? 'Very poor' : sleepQuality === 2 ? 'Poor' : sleepQuality === 3 ? 'Okay' : sleepQuality === 4 ? 'Good' : 'Great'}
              </p>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#555' }}>
                Anything to note? <span style={{ fontWeight: 400, color: '#aaa' }}>(optional)</span>
              </p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={`e.g. ${childName} seems congested, skipped lunch...`}
                rows={2}
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '2px solid #F0F0F0', borderRadius: 10,
                  fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  resize: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#E07A5F'}
                onBlur={e => e.target.style.borderColor = '#F0F0F0'}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={save}
                disabled={!mood || saving}
                style={{
                  flex: 1, padding: 14, background: '#E07A5F',
                  color: 'white', border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: !mood || saving ? 'not-allowed' : 'pointer',
                  opacity: !mood || saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving...' : 'Save check-in ✓'}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '14px 18px', background: 'none',
                  color: '#aaa', border: '1.5px solid #F0EDED',
                  borderRadius: 12, fontSize: 14, cursor: 'pointer',
                }}
              >
                Skip
              </button>
            </div>

            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#ddd', textAlign: 'center' }}>
              AskNeer remembers this to personalize future answers.
            </p>
          </>
        )}
      </div>
    </div>
  )
}