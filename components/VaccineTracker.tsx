'use client'

import { useEffect, useState } from 'react'

interface Vaccine {
  id: string
  vaccine_name: string
  due_date: string
  completed: boolean
  completed_date?: string
}

interface Props {
  email: string
  childName: string
  childDob: string
  onClose: () => void
}

export default function VaccineTracker({ email, childName, childDob, onClose }: Props) {
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Vaccine | null>(null)
  const [marking, setMarking] = useState(false)
  const [showAllOverdue, setShowAllOverdue] = useState(false)

  useEffect(() => {
    fetch(`/api/vaccines?email=${encodeURIComponent(email)}&child_name=${encodeURIComponent(childName)}&dob=${childDob}`)
      .then(r => r.json())
      .then(d => { setVaccines(d.vaccines || []); setLoading(false) })
  }, [email, childName, childDob])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const overdue   = vaccines.filter(v => !v.completed && new Date(v.due_date) < today)
  const upcoming  = vaccines.filter(v => !v.completed && new Date(v.due_date) >= today && new Date(v.due_date) <= in30Days)
  const future    = vaccines.filter(v => !v.completed && new Date(v.due_date) > in30Days)
  const completed = vaccines.filter(v => v.completed)
  const total     = vaccines.length
  const pct       = total ? Math.round((completed.length / total) * 100) : 0
  const visibleOverdue = showAllOverdue ? overdue : overdue.slice(0, 3)

  const markDone = async (vaccine: Vaccine) => {
    setMarking(true)
    const today_str = new Date().toISOString().split('T')[0]
    await fetch('/api/vaccines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vaccine.id, completed: true, completed_date: today_str }),
    })
    setVaccines(prev => prev.map(v => v.id === vaccine.id ? { ...v, completed: true, completed_date: today_str } : v))
    setSelected(null)
    setMarking(false)
  }

  const markUndone = async (vaccine: Vaccine) => {
    setMarking(true)
    await fetch('/api/vaccines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vaccine.id, completed: false, completed_date: null }),
    })
    setVaccines(prev => prev.map(v => v.id === vaccine.id ? { ...v, completed: false, completed_date: undefined } : v))
    setSelected(null)
    setMarking(false)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const Card = ({ vaccine, status }: { vaccine: Vaccine; status: 'overdue' | 'upcoming' | 'future' | 'completed' }) => {
    const cfg = {
      overdue:   { dot: '#E53E3E', badge: '#FFF0F0', badgeText: '#C53030', label: 'Overdue' },
      upcoming:  { dot: '#E07A5F', badge: '#FFF0E8', badgeText: '#C05621', label: 'Due Soon' },
      future:    { dot: '#CBD5E0', badge: '#F7FAFC', badgeText: '#718096', label: 'Scheduled' },
      completed: { dot: '#38A169', badge: '#F0FFF4', badgeText: '#276749', label: 'Done ✓' },
    }[status]

    return (
      <div onClick={() => setSelected(vaccine)} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', background: 'white',
        borderRadius: 12, cursor: 'pointer',
        border: '1px solid #F0EDED',
        transition: 'box-shadow 0.15s',
      }}
        onMouseOver={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)')}
        onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#2D2D2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {vaccine.vaccine_name}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#999' }}>
            {status === 'completed'
              ? `Given ${vaccine.completed_date ? fmt(vaccine.completed_date) : ''}`
              : `Due ${fmt(vaccine.due_date)}`}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: cfg.badge, color: cfg.badgeText, flexShrink: 0 }}>
          {cfg.label}
        </span>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#FFF9F5', zIndex: 3000, display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: 'white', padding: '14px 20px', borderBottom: '1px solid #F0EDED', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#888', padding: '0 4px', lineHeight: 1 }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: '#2D2D2D' }}>Vaccine Tracker</p>
          <p style={{ margin: 0, fontSize: 12, color: '#999' }}>{childName}</p>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#aaa', fontSize: 15 }}>
            Loading {childName}'s schedule...
          </div>
        ) : (
          <>
            {/* Progress card */}
            <div style={{ background: 'white', borderRadius: 16, padding: '20px 20px 16px', marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#2D2D2D' }}>{childName}'s vaccine journey</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#999' }}>{completed.length} of {total} vaccines completed</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 26, color: '#E07A5F', lineHeight: 1 }}>{pct}%</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#aaa' }}>complete</p>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ background: '#F5F5F5', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #E07A5F, #F4A98A)', borderRadius: 99, transition: 'width 0.6s ease' }} />
              </div>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                {[
                  { label: 'Overdue', count: overdue.length, color: '#C53030', bg: '#FFF0F0' },
                  { label: 'Due Soon', count: upcoming.length, color: '#C05621', bg: '#FFF0E8' },
                  { label: 'Upcoming', count: future.length, color: '#4A5568', bg: '#F7FAFC' },
                  { label: 'Done', count: completed.length, color: '#276749', bg: '#F0FFF4' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 10, padding: '8px 4px', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: s.color }}>{s.count}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10, color: s.color, fontWeight: 600 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p style={{ fontSize: 11, color: '#B07D2A', background: '#FFFBEB', border: '1px solid #F6E05E', borderRadius: 8, padding: '8px 12px', marginBottom: 20, lineHeight: 1.5 }}>
              📋 Based on WHO guidelines. Always consult your pediatrician before any vaccination. AskNeer is not a medical service.
            </p>

            {/* Overdue section */}
            {overdue.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#C53030', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔴 Overdue <span style={{ fontWeight: 400, color: '#E57373' }}>({overdue.length})</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {visibleOverdue.map(v => <Card key={v.id} vaccine={v} status="overdue" />)}
                </div>
                {overdue.length > 3 && (
                  <button onClick={() => setShowAllOverdue(!showAllOverdue)} style={{ marginTop: 10, width: '100%', padding: '10px', background: 'none', border: '1px dashed #FFAAAA', borderRadius: 10, color: '#C53030', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {showAllOverdue ? 'Show less ↑' : `Show all ${overdue.length} overdue ↓`}
                  </button>
                )}
              </div>
            )}

            {/* Due soon */}
            {upcoming.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#C05621', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🟡 Due in next 30 days <span style={{ fontWeight: 400, color: '#ED8936' }}>({upcoming.length})</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {upcoming.map(v => <Card key={v.id} vaccine={v} status="upcoming" />)}
                </div>
              </div>
            )}

            {/* Future */}
            {future.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#4A5568', display: 'flex', alignItems: 'center', gap: 6 }}>
                  📅 Upcoming <span style={{ fontWeight: 400, color: '#A0AEC0' }}>({future.length})</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {future.map(v => <Card key={v.id} vaccine={v} status="future" />)}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#276749', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ✅ Completed <span style={{ fontWeight: 400, color: '#68D391' }}>({completed.length})</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {completed.map(v => <Card key={v.id} vaccine={v} status="completed" />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Vaccine detail bottom sheet */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFF9F5', borderRadius: '20px 20px 0 0', padding: '24px 24px 36px', width: '100%', maxWidth: 480 }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: '#E0D8D4', borderRadius: 99, margin: '0 auto 20px' }} />
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 18, color: '#2D2D2D' }}>{selected.vaccine_name}</p>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#999' }}>
              {selected.completed
                ? `Given on ${selected.completed_date ? fmt(selected.completed_date) : 'unknown date'}`
                : `Due ${fmt(selected.due_date)}`}
            </p>
            <div style={{ background: '#F5F5F5', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                💬 Consult your pediatrician before vaccination. They may adjust the schedule based on {childName}'s health history.
              </p>
            </div>
            {selected.completed ? (
              <button onClick={() => markUndone(selected)} disabled={marking} style={{ width: '100%', padding: 14, background: 'none', border: '1.5px solid #E0E0E0', borderRadius: 12, fontSize: 15, color: '#999', cursor: 'pointer', fontWeight: 600 }}>
                {marking ? 'Updating...' : '↩ Mark as not done'}
              </button>
            ) : (
              <button onClick={() => markDone(selected)} disabled={marking} style={{ width: '100%', padding: 14, background: '#E07A5F', border: 'none', borderRadius: 12, fontSize: 15, color: 'white', cursor: 'pointer', fontWeight: 700 }}>
                {marking ? 'Saving...' : '✓ Mark as Done'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}