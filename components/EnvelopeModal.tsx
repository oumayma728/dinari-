'use client'
import { useState, useEffect } from 'react'
import { X, Star, Trash2 } from 'lucide-react'
import { Challenge } from '@/lib/types'
import { getPastel } from './EnvelopeCard'

const START_MONTH = '2026-08'

function monthsBetween(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  const months: string[] = []
  let y = fy, m = fm
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++; if (m > 12) { m = 1; y++ }
  }
  return months
}

function fmtMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const name = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]
  return `${name} ${y}`
}

interface Props {
  challenge: Challenge
  onSave: (id: string, history: Record<string, number>) => void
  onToggleEssential: (id: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export default function EnvelopeModal({ challenge: c, onSave, onToggleEssential, onDelete, onClose }: Props) {
  const p = getPastel(c.id)
  const currentMonth = new Date().toISOString().slice(0, 7)
  const months = monthsBetween(START_MONTH, currentMonth)

  const [amounts, setAmounts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const m of months) {
      const v = c.monthlyHistory?.[m]
      init[m] = v !== undefined ? String(v) : ''
    }
    return init
  })

  const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.savedAmount / c.targetAmount) * 100)) : 0

  const handleSave = () => {
    const history: Record<string, number> = {}
    for (const [m, v] of Object.entries(amounts)) {
      const n = parseFloat(v)
      if (!isNaN(n) && n > 0) history[m] = n
    }
    onSave(c.id, history)
    onClose()
  }

  // close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // reverse so newest month is at top
  const displayMonths = [...months].reverse()

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div style={{
        width: '100%', maxHeight: '85dvh',
        background: 'var(--card)',
        borderRadius: '22px 22px 0 0',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.22s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 28 }}>{c.icon || '🎯'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text)' }}>{c.name}</p>
              <p className="num" style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
                {c.savedAmount.toFixed(0)} / {c.targetAmount.toFixed(0)} TND · {pct}%
              </p>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'var(--faint)', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="var(--muted)" />
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ background: 'var(--faint)', borderRadius: 99, height: 5 }}>
            <div style={{ background: pct >= 100 ? '#4A8C5C' : p.bar, borderRadius: 99, height: 5, width: `${pct}%`, transition: 'width 0.4s' }} />
          </div>
        </div>

        {/* Month list — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', WebkitOverflowScrolling: 'touch' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Monthly contributions
          </p>
          {displayMonths.map(m => {
            const isCurrent = m === currentMonth
            return (
              <div key={m} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text)' : 'var(--muted)' }}>
                    {fmtMonthLabel(m)}
                  </span>
                  {isCurrent && (
                    <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, color: p.bar, background: `${p.bar}22`, padding: '2px 6px', borderRadius: 99 }}>
                      This month
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text" inputMode="decimal"
                    value={amounts[m] ?? ''}
                    onChange={e => setAmounts(prev => ({ ...prev, [m]: e.target.value.replace(/[^0-9.]/g, '') }))}
                    placeholder="0"
                    style={{
                      width: 80, textAlign: 'right',
                      border: 'none', outline: 'none',
                      background: isCurrent ? `${p.bar}18` : 'var(--faint)',
                      borderRadius: 8, padding: '7px 10px',
                      fontSize: 14, fontWeight: 700,
                      color: 'var(--text)',
                    }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, width: 28 }}>TND</span>
                </div>
              </div>
            )
          })}
          <div style={{ height: 8 }} />
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--card)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button onClick={() => onToggleEssential(c.id)}
              style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <Star size={14} fill={c.isEssential ? p.bar : 'none'} color={c.isEssential ? p.bar : 'var(--muted)'} />
              <span style={{ fontSize: 12, fontWeight: 600, color: c.isEssential ? p.bar : 'var(--muted)' }}>
                {c.isEssential ? 'Essential' : 'Mark essential'}
              </span>
            </button>
            <button onClick={() => { onDelete(c.id); onClose() }}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trash2 size={14} color="var(--muted)" />
            </button>
          </div>
          <button onClick={handleSave} className="btn-pink" style={{ width: '100%', padding: '14px' }}>
            Save
          </button>
        </div>
      </div>

      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  )
}
