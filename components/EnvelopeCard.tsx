'use client'
import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { Challenge } from '@/lib/types'

const PASTELS = [
  { bg: '#FFF0EC', flap: '#FFD9CC' },
  { bg: '#F3F0FF', flap: '#DDD6FF' },
  { bg: '#EDFAF3', flap: '#CCF0DD' },
  { bg: '#EDF4FF', flap: '#CCE0FF' },
  { bg: '#FFF0F6', flap: '#FFD6E8' },
  { bg: '#FEFAEC', flap: '#FAF0CC' },
]

function getPastel(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff
  return PASTELS[h % PASTELS.length]
}

function fmtMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[m - 1]} ${y}`
}

interface Props {
  challenge: Challenge
  onSetMonthAmount: (id: string, month: string, amount: number) => void
  onToggleEssential: (id: string) => void
  onDelete: (id: string) => void
  monthsLeft: (deadline: string) => number
}

export default function EnvelopeCard({ challenge: c, onSetMonthAmount, onToggleEssential, onDelete, monthsLeft }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingMonth, setEditingMonth] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const p = getPastel(c.id)
  const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.savedAmount / c.targetAmount) * 100)) : 0
  const done = pct >= 100
  const ml = c.deadline ? monthsLeft(c.deadline) : null
  const currentMonth = new Date().toISOString().slice(0, 7)

  const history = c.monthlyHistory || {}
  const historyMonths = Object.keys(history).sort((a, b) => b.localeCompare(a))
  const months = historyMonths.includes(currentMonth)
    ? historyMonths
    : [currentMonth, ...historyMonths]

  const startEdit = (month: string) => {
    setEditVal(history[month] !== undefined ? String(history[month]) : '')
    setEditingMonth(month)
  }

  const confirmEdit = (month: string) => {
    const v = parseFloat(editVal)
    if (!isNaN(v) && v >= 0) onSetMonthAmount(c.id, month, v)
    setEditingMonth(null)
  }

  return (
    <div
      onClick={() => { if (!editingMonth) setIsOpen(o => !o) }}
      style={{
        background: p.bg,
        borderRadius: 18,
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(26,22,20,0.07)',
        opacity: c.active ? 1 : 0.55,
      }}
    >
      {/* Envelope flap */}
      <div style={{
        transformOrigin: 'top center',
        transform: isOpen ? 'scaleY(0)' : 'scaleY(1)',
        transition: 'transform 0.25s ease',
        pointerEvents: 'none',
      }}>
        <svg width="100%" viewBox="0 0 100 52" preserveAspectRatio="none" style={{ display: 'block' }}>
          <polygon points="0,0 100,0 100,52 50,32 0,52" fill={p.flap} />
        </svg>
      </div>

      {/* Body */}
      <div style={{
        padding: '0 12px 12px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: isOpen ? 10 : -6,
        transition: 'margin-top 0.25s ease',
      }}>
        <span style={{ fontSize: 26, lineHeight: 1, marginBottom: 4 }}>{c.icon || '🎯'}</span>
        <p style={{
          fontSize: 11, fontWeight: 700, margin: 0, textAlign: 'center', color: '#2A2018',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {c.name}
        </p>

        {/* Closed: summary */}
        {!isOpen && (
          <p className="num" style={{ fontSize: 10, color: '#9B8E86', margin: '3px 0 0', fontWeight: 600 }}>
            {c.savedAmount.toFixed(0)} / {c.targetAmount.toFixed(0)} TND
          </p>
        )}

        {/* Open: full detail */}
        {isOpen && (
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', marginTop: 10 }}>

            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="num" style={{ fontSize: 13, fontWeight: 700, color: '#1A1614' }}>{c.savedAmount.toFixed(0)}</span>
              <span className="num" style={{ fontSize: 10, color: '#9B8E86' }}>/ {c.targetAmount.toFixed(0)} TND</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.09)', borderRadius: 99, height: 4, marginBottom: 4 }}>
              <div style={{ background: done ? '#4A8C5C' : 'var(--pink)', borderRadius: 99, height: 4, width: `${pct}%`, transition: 'width 0.4s' }} />
            </div>
            {done && <p style={{ fontSize: 9, color: '#4A8C5C', fontWeight: 700, margin: '0 0 5px' }}>✓ Goal reached!</p>}
            {!done && ml !== null && ml >= 0 && (
              <p style={{ fontSize: 9, color: ml <= 2 ? 'var(--pink)' : '#9B8E86', margin: '0 0 5px', fontWeight: 600 }}>
                {ml === 0 ? 'This month!' : `${ml} months left`}
              </p>
            )}

            <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)', margin: '4px 0 7px' }} />

            {/* Legacy amount row (savings before monthly tracking) */}
            {(c.baseAmount ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ flex: 1, fontSize: 10, fontWeight: 500, color: '#BDB5B0', fontStyle: 'italic' }}>Before tracking</span>
                <span className="num" style={{ fontSize: 11, fontWeight: 700, color: '#BDB5B0' }}>{c.baseAmount!.toFixed(0)} TND</span>
              </div>
            )}

            {/* Monthly rows */}
            {months.map(month => {
              const amount = history[month]
              const isCurrent = month === currentMonth
              const isEditing = editingMonth === month
              const hasEntry = amount !== undefined

              return (
                <div key={month} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, minHeight: 24 }}>
                  <span style={{ flex: 1, fontSize: 10, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#2A2018' : '#9B8E86' }}>
                    {fmtMonth(month)}
                  </span>

                  {isEditing ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="text" inputMode="decimal" value={editVal}
                        onChange={e => setEditVal(e.target.value.replace(/[^0-9.]/g, ''))}
                        onBlur={() => confirmEdit(month)}
                        onKeyDown={e => { if (e.key === 'Enter') confirmEdit(month); if (e.key === 'Escape') setEditingMonth(null) }}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                        style={{ width: 58, border: 'none', outline: 'none', background: 'rgba(0,0,0,0.08)', borderRadius: 7, padding: '4px 6px', fontSize: 11, fontWeight: 700, textAlign: 'right' }}
                      />
                      <span style={{ fontSize: 9, color: '#9B8E86', fontWeight: 600 }}>TND</span>
                    </div>
                  ) : hasEntry ? (
                    <button onClick={e => { e.stopPropagation(); startEdit(month) }}
                      style={{ border: 'none', background: 'rgba(0,0,0,0.05)', borderRadius: 7, padding: '3px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="num" style={{ fontSize: 11, fontWeight: 700, color: '#2A2018' }}>{amount.toFixed(0)}</span>
                      <span style={{ fontSize: 9, color: '#9B8E86', fontWeight: 600 }}>TND</span>
                    </button>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); startEdit(month) }}
                      style={{ border: 'none', background: 'var(--pink)', borderRadius: 7, padding: '3px 11px', cursor: 'pointer' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1 }}>+</span>
                    </button>
                  )}
                </div>
              )
            })}

            <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)', margin: '6px 0' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button onClick={e => { e.stopPropagation(); onToggleEssential(c.id) }}
                style={{ padding: '4px 8px', borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={10} fill={c.isEssential ? 'var(--pink)' : 'none'} color={c.isEssential ? 'var(--pink)' : '#BDB5B0'} />
                {c.isEssential && <span style={{ fontSize: 9, color: 'var(--pink)', fontWeight: 700 }}>Essential</span>}
              </button>
              <button onClick={e => { e.stopPropagation(); onDelete(c.id) }}
                style={{ padding: '4px 6px', borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex' }}>
                <Trash2 size={10} color="#BDB5B0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
