'use client'

interface Props {
  name: string
  dob: string
  memories: string[]
  nextVaccine: { name: string; due_date: string } | null
  getAge: (dob: string) => string
}

export default function ChildSnapshot({ name, dob, memories, nextVaccine, getAge }: Props) {
  // Deduplicate memories (case-insensitive)
  const seen = new Set<string>()
  const uniqueMemories = memories.filter(m => {
    const key = m.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const allergies = uniqueMemories.filter(m =>
    (m.toLowerCase().includes('allerg') || m.toLowerCase().includes('intoleran')) &&
    !m.toLowerCase().includes('not allerg') &&
    !m.toLowerCase().includes('no allerg')
  )

  const activities = uniqueMemories.filter(m =>
    m.toLowerCase().includes('lesson') ||
    m.toLowerCase().includes('class') ||
    m.toLowerCase().includes('swim') ||
    m.toLowerCase().includes('sport') ||
    m.toLowerCase().includes('school') ||
    m.toLowerCase().includes('daycare') ||
    m.toLowerCase().includes('playgroup')
  ).slice(0, 1)

  const health = uniqueMemories.filter(m =>
    m.toLowerCase().includes('condition') ||
    m.toLowerCase().includes('medication') ||
    m.toLowerCase().includes('eczema') ||
    m.toLowerCase().includes('asthma')
  ).slice(0, 1)

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short'
  })

  // Shorten long memories at word boundaries, not mid-word
  const shorten = (text: string, max: number = 32) => {
    if (text.length <= max) return text
    const cut = text.substring(0, max)
    const lastSpace = cut.lastIndexOf(' ')
    return cut.substring(0, lastSpace > 10 ? lastSpace : max) + '…'
  }

  const items = [
    ...allergies.map(a => ({ icon: '⚠️', text: a })),
    ...activities.map(a => ({ icon: '🏃', text: a })),
    ...health.map(h => ({ icon: '❤️', text: h })),
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
          <div key={i} title={item.text} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: '#FFF9F5', borderRadius: 20,
            padding: '4px 12px', flexShrink: 0,
            border: '1px solid #F0EDED',
          }}>
            <span style={{ fontSize: 12 }}>{item.icon}</span>
            <span style={{ fontSize: 12, color: '#555', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}