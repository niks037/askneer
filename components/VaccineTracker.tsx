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

  useEffect(() => {
    fetch(`/api/vaccines?email=${encodeURIComponent(email)}&child_name=${encodeURIComponent(childName)}&dob=${childDob}`)
      .then(r => r.json())
      .then(d => { setVaccines(d.vaccines || []); setLoading(false) })
  }, [email, childName, childDob])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const overdue = vaccines.filter(v => !v.completed && new Date(v.due_date) < today)
  const upcoming = vaccines.filter(v => !v.completed && new Date(v.due_date) >= today && new Date(v.due_date) <= in30Days)
  const future = vaccines.filter(v => !v.completed && new Date(v.due_date) > in30Days)
  const completed = vaccines.filter(v => v.completed)

  const markDone = async (vaccine: Vaccine) => {
    setMarking(true)
    const today_str = new Date().toISOString().split('T')[0]
    await fetch('/api/vaccines', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: vaccine.id, completed: true, completed_date: today_str }),
    })
    setVaccines(prev => prev.map(v => v.id === vaccine.id
      ? { ...v, completed: true, completed_date: today_str } : v))
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
    setVaccines(prev => prev.map(v => v.id === vaccine.id
      ? { ...v, completed: false, completed_date: undefined } : v))
    setSelected(null)
    setMarking(false)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  const VaccineCard = ({ vaccine, status }: { vaccine: Vaccine; status: 'overdue' | 'upcoming' | 'future' | 'completed' }) => {
    const colors = {
      overdue:   { bg: '#FFF0F0', border: '#FFB3B3', dot: '#E53E3E', label: 'Overdue',      labelBg: '#FFE5E5',  labelColor: '#C53030' },
      upcoming:  { bg: '#FFF8F0', border: '#FDDCB5', dot: '#E07A5F', label: 'Due Soon',     labelBg: '#FFF0E8',  labelColor: '#C05621' },
      future:    { bg: '#F9F9F9', border: '#E8E8E8', dot: '#CBD5E0', label: 'Scheduled',    labelBg: '#EDF2F7',  labelColor: '#4A5568' },
      completed: { bg: '#F0FFF4', border: '#9AE6B4', dot: '#38A169', label: 'Completed',    labelBg: '#C6F6D5',  labelColor: '#276749' },
    }
    const c = colors[status]

    return (
      <div
        onClick={() => setSelected(vaccine)}
        style={{
          background: c.bg, border: `1px solid ${c.border}`,
          borderRadius: 12, padding: '12px 14px',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', gap: 12,
          transition: 'opacity 0.15s',
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#2D2D2D' }}>{vaccine.vaccine_name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
            {status === 'completed'
              ? `Given ${vaccine.completed_date ? formatDate(vaccine.completed_date) : ''}`
              : `Due ${formatDate(vaccine.due_date)}`}
          </p>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: c.labelBg, color: c.labelColor }}>
          {c.label}
        </span>
      </div>
    )
  }

  const Section = ({ title, items, status, emoji }: {
    title: string; items: Vaccine[];
    status: 'overdue' | 'upcoming' | 'future' | 'completed'; emoji: string
  }) => {
    if (!items.length) return null
    return (
      <div style={{ marginBottom: 24 }}>
        <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
          {emoji} {title} <span style={{ fontWeight: 400, color: '#aaa' }}>({items.length})</span>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(v => <VaccineCard key={v.id} vaccine={v} status={status} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#FFF9F5',
      zIndex: 3000, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #F0E8E4',
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#FFF9F5',
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: '#888', padding: 4,
        }}>←</button>
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 17, color: '#2D2D2D' }}>
            💉 Vaccine Tracker
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{childName}</p>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#38A169', fontWeight: 600 }}>
            {completed.length}/{vaccines.length} done
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: '10px 20px', background: '#FFF8E8', borderBottom: '1px solid #F0E8D4' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#92610A', lineHeight: 1.5 }}>
          ⚠️ Based on WHO guidelines. Always consult your pediatrician before any vaccination. AskNeer is not a medical service.
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
            Loading {childName}'s vaccine schedule...
          </div>
        ) : (
          <>
            <Section title="Overdue" items={overdue} status="overdue" emoji="🔴" />
            <Section title="Due in next 30 days" items={upcoming} status="upcoming" emoji="🟡" />
            <Section title="Upcoming" items={future} status="future" emoji="📅" />
            <Section title="Completed" items={completed} status="completed" emoji="✅" />
          </>
        )}
      </div>

      {/* Vaccine detail modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 4000, display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', padding: '0 16px 24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#FFF9F5', borderRadius: 20,
              padding: 24, width: '100%', maxWidth: 440,
            }}
          >
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 18, color: '#2D2D2D' }}>
              {selected.vaccine_name}
            </p>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>
              {selected.completed
                ? `Given on ${selected.completed_date ? formatDate(selected.completed_date) : 'unknown date'}`
                : `Due ${formatDate(selected.due_date)}`}
            </p>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#555', lineHeight: 1.6, padding: '12px 14px', background: '#F5F5F5', borderRadius: 10 }}>
              💬 Always check with your pediatrician before vaccination. They may adjust the schedule based on {childName}'s specific health history.
            </p>

            {selected.completed ? (
              <button
                onClick={() => markUndone(selected)}
                disabled={marking}
                style={{
                  width: '100%', padding: 14, background: 'none',
                  border: '1px solid #E8E8E8', borderRadius: 12,
                  fontSize: 15, color: '#888', cursor: 'pointer', fontWeight: 600,
                }}
              >
                {marking ? 'Updating...' : 'Mark as not done'}
              </button>
            ) : (
              <button
                onClick={() => markDone(selected)}
                disabled={marking}
                style={{
                  width: '100%', padding: 14, background: '#E07A5F',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, color: 'white', cursor: 'pointer', fontWeight: 700,
                }}
              >
                {marking ? 'Saving...' : '✓ Mark as Done'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}