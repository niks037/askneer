 'use client'

interface Props {
  name: string
  memories: string[]
  onClose: () => void
  onDelete: (memory: string) => void
}

export default function MemoryView({ name, memories, onClose, onDelete }: Props) {
  const categories = [
    {
      label: "Health & Allergies",
      icon: "❤️",
      filter: (m: string) => m.toLowerCase().includes('allerg') || m.toLowerCase().includes('condition') || m.toLowerCase().includes('medication') || m.toLowerCase().includes('eczema') || m.toLowerCase().includes('asthma') || m.toLowerCase().includes('intoleran'),
    },
    {
      label: "Feeding & Nutrition",
      icon: "🍼",
      filter: (m: string) => m.toLowerCase().includes('feed') || m.toLowerCase().includes('solid') || m.toLowerCase().includes('food') || m.toLowerCase().includes('eat') || m.toLowerCase().includes('breastfeed') || m.toLowerCase().includes('bottle'),
    },
    {
      label: "Sleep",
      icon: "🌙",
      filter: (m: string) => m.toLowerCase().includes('sleep') || m.toLowerCase().includes('nap') || m.toLowerCase().includes('night') || m.toLowerCase().includes('wake'),
    },
    {
      label: "Activities & School",
      icon: "🏃",
      filter: (m: string) => m.toLowerCase().includes('lesson') || m.toLowerCase().includes('class') || m.toLowerCase().includes('school') || m.toLowerCase().includes('daycare') || m.toLowerCase().includes('swim') || m.toLowerCase().includes('sport') || m.toLowerCase().includes('playgroup'),
    },
    {
      label: "Milestones",
      icon: "🏆",
      filter: (m: string) => m.toLowerCase().includes('walk') || m.toLowerCase().includes('talk') || m.toLowerCase().includes('tooth') || m.toLowerCase().includes('word') || m.toLowerCase().includes('milestone') || m.toLowerCase().includes('first'),
    },
  ]

  const categorized = new Set<string>()
  const categorizedMemories = categories.map(cat => {
    const items = memories.filter(m => cat.filter(m) && !categorized.has(m))
    items.forEach(m => categorized.add(m))
    return { ...cat, items }
  })
  const other = memories.filter(m => !categorized.has(m))

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFF9F5', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>

        {/* Handle */}
        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ width: 40, height: 4, background: '#E0D8D4', borderRadius: 99, margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2D2D2D' }}>
              🧠 What Neer knows about {name}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>
            These memories help personalize every answer.
          </p>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', padding: '0 24px 32px' }}>
          {memories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>🧠</p>
              <p style={{ fontSize: 14, margin: 0 }}>No memories yet. Start chatting and AskNeer will remember important things about {name}.</p>
            </div>
          ) : (
            <>
              {categorizedMemories.map(cat => cat.items.length > 0 && (
                <div key={cat.label} style={{ marginBottom: 20 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {cat.icon} {cat.label}
                  </p>
                  {cat.items.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: 6, border: '1px solid #F0EDED' }}>
                      <span style={{ fontSize: 14, color: '#2D2D2D' }}>{m}</span>
                      <button onClick={() => onDelete(m)} style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 16, padding: '0 0 0 8px', flexShrink: 0 }}
                        onMouseOver={e => (e.currentTarget.style.color = '#E07A5F')}
                        onMouseOut={e => (e.currentTarget.style.color = '#ddd')}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              {other.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
                    📝 Other
                  </p>
                  {other.map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 10, padding: '10px 14px', marginBottom: 6, border: '1px solid #F0EDED' }}>
                      <span style={{ fontSize: 14, color: '#2D2D2D' }}>{m}</span>
                      <button onClick={() => onDelete(m)} style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 16, padding: '0 0 0 8px', flexShrink: 0 }}
                        onMouseOver={e => (e.currentTarget.style.color = '#E07A5F')}
                        onMouseOut={e => (e.currentTarget.style.color = '#ddd')}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}