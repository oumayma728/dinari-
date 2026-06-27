'use client'
import { useState } from 'react'
import { RecurringTransaction } from '@/lib/types'
import { format } from 'date-fns'

interface Props {
  recurring: RecurringTransaction[]
  onApply: (selectedIds: string[]) => void
  onSkip: () => void
}

export default function RecurringModal({ recurring, onApply, onSkip }: Props) {
  const active = recurring.filter(r => r.active)
  const [selected, setSelected] = useState<Set<string>>(new Set(active.map(r => r.id)))

  const toggle = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(44,36,32,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 430, margin: '0 auto', background: 'var(--bg)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {format(new Date(), 'MMMM yyyy')}
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>Monthly transactions</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 20px' }}>
          Which ones happened this month?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {active.map(r => (
            <button key={r.id} onClick={() => toggle(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: selected.has(r.id) ? 'rgba(61,90,92,0.08)' : 'white',
              border: `1.5px solid ${selected.has(r.id) ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 14, padding: '12px 14px', textAlign: 'left',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: selected.has(r.id) ? 'var(--primary)' : 'var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {selected.has(r.id) && <span style={{ color: 'white', fontSize: 13 }}>✓</span>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{r.description}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>{r.category} · Day {r.dayOfMonth}</p>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: r.type === 'income' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                {r.type === 'income' ? '+' : '-'}{r.amount} TND
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onSkip} style={{ flex: 1, padding: '14px', borderRadius: 14, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, color: 'var(--text-muted)' }}>
            Skip
          </button>
          <button onClick={() => onApply(Array.from(selected))} style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600 }}>
            Apply {selected.size} transactions
          </button>
        </div>
      </div>
    </div>
  )
}
