'use client'
import { useState } from 'react'

interface Memory {
  memory: string
  source?: string
}

interface Props {
  name: string
  memories: Memory[]
  onClose: () => void
  onDelete: (memory: string) => void
  onConfirm: (memory: string, edited?: string) => void
}

export default function MemoryView({ name, memories, onClose, onDelete, onConfirm }: Props) {
  const [editingMemory, setEditingMemory] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const categories = [
    {
      label: "Health & Allergies",
      icon: "❤️",
      filter: (m: Memory) =>
        (m.memory.toLowerCase().includes('allerg') ||
        m.memory.toLowerCase().includes('intoleran') ||
        m.memory.toLowerCase().includes('condition') ||
        m.memory.toLowerCase().includes('medication') ||
        m.memory.toLowerCase().includes('eczema') ||
        m.memory.toLowerCase().includes('asthma')) &&
        !m.memory.toLowerCase().includes('not allerg') &&
        !m.memory.toLowerCase().includes('no allerg'),
    },
    {
      label: "Feeding & Nutrition",
      icon: "🍼",
      filter: (m: Memory) =>
        m.memory.toLowerCase().includes('feed') ||
        m.memory.toLowerCase().includes('solid') ||
        m.memory.toLowerCase().includes('food') ||
        m.memory.toLowerCase().includes('eat') ||
        m.memory.toLowerCase().includes('breastfeed') ||
        m.memory.toLowerCase().includes('bottle'),
    },
    {
      label: "Sleep",
      icon: "🌙",
      filter: (m: Memory) =>
        m.memory.toLowerCase().includes('sleep') ||
        m.memory.toLowerCase().includes('nap') ||
        m.memory.toLowerCase().includes('night') ||
        m.memory.toLowerCase().includes('wake'),
    },
    {
      label: "Activities & School",
      icon: "🏃",
      filter: (m: Memory) =>
        m.memory.toLowerCase().includes('lesson') ||
        m.memory.toLowerCase().includes('class') ||
        m.memory.toLowerCase().includes('school') ||
        m.memory.toLowerCase().includes('daycare') ||
        m.memory.toLowerCase().includes('swim') ||
        m.memory.toLowerCase().includes('sport') ||
        m.memory.toLowerCase().includes('playgroup'),
    },
    {
      label: "Milestones",
      icon: "🏆",
      filter: (m: Memory) =>
        m.memory.toLowerCase().includes('walk') ||
        m.memory.toLowerCase().includes('talk') ||
        m.memory.toLowerCase().includes('tooth') ||
        m.memory.toLowerCase().includes('word') ||
        m.memory.toLowerCase().includes('milestone') ||
        m.memory.toLowerCase().includes('first'),
    },
  ]

  const categorized = new Set<string>()
  const categorizedMemories = categories.map(cat => {
    const items = memories.filter(m => cat.filter(m) && !categorized.has(m.memory))
    items.forEach(m => categorized.add(m.memory))
    return { ...cat, items }
  })
  const other = memories.filter(m => !categorized.has(m.memory))

  function MemoryItem({ m }: { m: Memory }) {
    const isAI = !m.source || m.source === 'ai'
    const isEditing = editingMemory === m.memory

    return (
      <div style={{
        background: 'white', borderRadius: 10, padding: '10px 14px',
        marginBottom: 6, border: isAI ? '1px solid #FEE2B3' : '1px solid #F0EDED'
      }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '2px solid #E07A5F', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  onConfirm(m.memory, editValue);
                  setEditingMemory(null);
                }}
                style={{ flex: 1, padding: '6px', background: '#E07A5F', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Save & Confirm
              </button>
              <button
                onClick={() => setEditingMemory(null)}
                style={{ padding: '6px 12px', background: 'none', border: '1px solid #F0EDED', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#888' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, color: '#2D2D2D' }}>{m.memory}</span>
              {isAI ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#F59E0B', fontWeight: 600, background: '#FEF3C7', borderRadius: 4, padding: '1px 6px' }}>
                    AI extracted · Review
                  </span>
                  <button
                    onClick={() => { onConfirm(m.memory); }}
                    style={{ fontSize: 10, color: '#38A169', fontWeight: 600, background: '#F0FFF4', border: '1px solid #9AE6B4', borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}
                  >
                    ✓ Confirm
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#38A169', fontWeight: 600, background: '#F0FFF4', borderRadius: 4, padding: '1px 6px' }}>
                    ✓ You confirmed
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => { setEditingMemory(m.memory); setEditValue(m.memory); }}
                style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 13, padding: '0 4px' }}
                onMouseOver={e => (e.currentTarget.style.color = '#E07A5F')}
                onMouseOut={e => (e.currentTarget.style.color = '#bbb')}
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(m.memory)}
                style={{ background: 'none', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
                onMouseOver={e => (e.currentTarget.style.color = '#E07A5F')}
                onMouseOut={e => (e.currentTarget.style.color = '#ddd')}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFF9F5', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ width: 40, height: 4, background: '#E0D8D4', borderRadius: 99, margin: '0 auto 16px' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#2D2D2D' }}>
              🧠 What Neer knows about {name}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#888' }}>
            Review, confirm, edit or delete what AskNeer remembers.
          </p>
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#92400E' }}>
              ⚠️ AI extracted memories may not be accurate. Review anything important — especially allergies and health information.
            </p>
          </div>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 24px 32px' }}>
          {memories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#aaa' }}>
              <p style={{ fontSize: 32, margin: '0 0 8px' }}>🧠</p>
              <p style={{ fontSize: 14, margin: 0 }}>No memories yet. Start chatting and AskNeer will remember important things about {name}.</p>
            </div>
          ) : (
            <>
              {categorizedMemories.map(cat => cat.items.length > 0 && (
                <div key={cat.label} style={{ marginBottom: 20, marginTop: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {cat.icon} {cat.label}
                  </p>
                  {cat.items.map((m, i) => <MemoryItem key={i} m={m} />)}
                </div>
              ))}
              {other.length > 0 && (
                <div style={{ marginBottom: 20, marginTop: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
                    📝 Other
                  </p>
                  {other.map((m, i) => <MemoryItem key={i} m={m} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}