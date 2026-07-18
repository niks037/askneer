'use client'

interface Props {
  name: string
  dob: string
  memories: string[]
  nextVaccine: { name: string; due_date: string } | null
  getAge: (dob: string) => string
}

export default function ChildSnapshot({ name, dob, memories, nextVaccine, getAge }: Props) {
  const allergies = memories.filter(m =>
    m.toLowerCase().includes('allerg') ||
    m.toLowerCase().includes('intoleran')
  )

  const activities = memories.filter(m =>
    m.toLowerCase().includes('lesson') ||
    m.toLowerCase().includes('class') ||
    m.toLowerCase().includes('swim') ||
    m.toLowerCase().includes('sport') ||
    m.toLowerCase().includes('school') ||
    m.toLowerCase().includes('daycare') ||
    m.toLowerCase().includes('playgroup')
  )

  const health = memories.filter(m =>
    m.toLowerCase().includes('condition') ||
    m.toLowerCase().includes('medication') ||
    m.toLowerCase().includes('diagnosis') ||
    m.toLowerCase().includes('eczema') ||
    m.toLowerCase().includes('asthma')
  )

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short'
  })

  const items = [
    ...allergies.map(a => ({ icon: '⚠️', text: a })),
    ...activities.slice(0, 2).map(a => ({ icon: '🏃', text: a })),
    ...health.slice(0, 1).map(h => ({ icon: '❤️', text: h })),
    nextVaccine ? { icon: '💉', text: `Next vaccine: ${fmt(nextVaccine.due_date)}` } : null,
  ].filter(Boolean) as { icon: string; text: string }[]

  if (items.length === 0) return null

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #F5F0EE',
      padding: '10px 20px',
      overflowX: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 'max-content',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>
          What Neer knows
        </span>
        <div style={{ width: 1, height: 16, background: '#F0EDED', flexShrink: 0 }} />
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#FFF9F5', borderRadius: 20,
            padding: '4px 10px', flexShrink: 0,
            border: '1px solid #F0EDED',
          }}>
            <span style={{ fontSize: 12 }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {item.text.length > 30 ? item.text.substring(0, 30) + '...' : item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}