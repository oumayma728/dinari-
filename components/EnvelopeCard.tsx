'use client'
import { useState } from 'react'
import { Star, Pencil, Trash2, Plus } from 'lucide-react'
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
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff
  return PASTELS[h % PASTELS.length]
}

interface Props {
  challenge: Challenge
  onUpdateSaved: (id: string, val: number) => void
  onToggleEssential: (id: string) => void
  onDelete: (id: string) => void
  monthsLeft: (deadline: string) => number
}

export default function EnvelopeCard({ challenge: c, onUpdateSaved, onToggleEssential, onDelete, monthsLeft }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editVal, setEditVal] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addVal, setAddVal] = useState('')

  const p = getPastel(c.id)
  const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.savedAmount / c.targetAmount) * 100)) : 0
  const done = pct >= 100
  const ml = c.deadline ? monthsLeft(c.deadline) : null
  const monthly = ml && ml > 0 ? (c.targetAmount - c.savedAmount) / ml : null

  const handleCardClick = () => {
    if (showEdit || showAdd) return
    setIsOpen(o => !o)
  }

  return (
    <div
      onClick={handleCardClick}
      style={{
        background: p.bg,
        borderRadius: 18,
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(26,22,20,0.07)',
        opacity: c.active ? 1 : 0.55,
        transition: 'box-shadow 0.15s',
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

      {/* Closed body: icon + name */}
      <div style={{
        padding: '0 10px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: isOpen ? 8 : -6,
        transition: 'margin-top 0.25s ease',
      }}>
        <span style={{ fontSize: 26, lineHeight: 1, marginBottom: 5 }}>{c.icon || '🎯'}</span>
        <p style={{
          fontSize: 11, fontWeight: 700, margin: 0, textAlign: 'center', color: '#2A2018',
          letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {c.name}
        </p>

        {/* Open detail panel */}
        {isOpen && (
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', marginTop: 10 }}
          >
            {/* Amounts */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <span className="num" style={{ fontSize: 16, fontWeight: 700, color: '#1A1614' }}>{c.savedAmount.toFixed(0)}</span>
              <span className="num" style={{ fontSize: 10, color: '#9B8E86' }}>/ {c.targetAmount.toFixed(0)} TND</span>
            </div>

            {/* Progress */}
            <div style={{ background: 'rgba(0,0,0,0.09)', borderRadius: 99, height: 4, marginBottom: 5 }}>
              <div style={{
                background: done ? '#4A8C5C' : 'var(--pink)',
                borderRadius: 99, height: 4,
                width: `${pct}%`, transition: 'width 0.4s',
              }} />
            </div>

            {/* Deadline/monthly */}
            {!done && ml !== null && ml >= 0 && (
              <p style={{ fontSize: 10, color: ml <= 2 ? 'var(--pink)' : '#9B8E86', margin: '0 0 3px', fontWeight: 600 }}>
                {ml === 0 ? 'This month' : `${ml}mo left`}
                {monthly !== null ? ` · ${monthly.toFixed(0)}/mo` : ''}
              </p>
            )}
            {done && <p style={{ fontSize: 10, color: '#4A8C5C', fontWeight: 700, margin: '0 0 3px' }}>✓ Done!</p>}

            {/* Add money input */}
            {showAdd && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                <input
                  type="number" inputMode="decimal" value={addVal}
                  onChange={e => setAddVal(e.target.value)}
                  placeholder="Add amount"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'rgba(0,0,0,0.07)', borderRadius: 8, padding: '6px 8px', fontSize: 12, fontWeight: 600, minWidth: 0 }}
                />
                <button
                  onClick={e => {
                    e.stopPropagation()
                    const v = parseFloat(addVal) || 0
                    if (v > 0) onUpdateSaved(c.id, c.savedAmount + v)
                    setAddVal(''); setShowAdd(false)
                  }}
                  style={{ padding: '6px 9px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  +
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setShowAdd(false); setAddVal('') }}
                  style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.07)', color: '#9B8E86', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Edit total input */}
            {showEdit && (
              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                <input
                  type="number" inputMode="decimal" value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  placeholder="Total saved"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'rgba(0,0,0,0.07)', borderRadius: 8, padding: '6px 8px', fontSize: 12, fontWeight: 600, minWidth: 0 }}
                />
                <button
                  onClick={e => { e.stopPropagation(); onUpdateSaved(c.id, parseFloat(editVal) || 0); setShowEdit(false) }}
                  style={{ padding: '6px 9px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  OK
                </button>
              </div>
            )}

            {/* Action row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
              {!showAdd && !done && (
                <button
                  onClick={e => { e.stopPropagation(); setShowAdd(true); setShowEdit(false) }}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, border: 'none',
                    background: 'var(--pink)', color: 'white', fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                  }}
                >
                  <Plus size={10} /> Stuff
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); onToggleEssential(c.id) }}
                title="Mark essential (counts in safe-to-spend)"
                style={{ padding: 5, borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex' }}
              >
                <Star size={11} fill={c.isEssential ? 'var(--pink)' : 'none'} color={c.isEssential ? 'var(--pink)' : '#BDB5B0'} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setEditVal(String(c.savedAmount)); setShowEdit(s => !s); setShowAdd(false) }}
                style={{ padding: 5, borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex' }}
              >
                <Pencil size={11} color="#BDB5B0" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(c.id) }}
                style={{ padding: 5, borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex' }}
              >
                <Trash2 size={11} color="#BDB5B0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
