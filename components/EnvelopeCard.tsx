'use client'
import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { Challenge } from '@/lib/types'

const PASTELS = [
  { bg: '#FFF0EC', flap: '#FFD9CC', bar: '#E8946A' },
  { bg: '#F3F0FF', flap: '#DDD6FF', bar: '#8B73E8' },
  { bg: '#EDFAF3', flap: '#CCF0DD', bar: '#4A9E6A' },
  { bg: '#EDF4FF', flap: '#CCE0FF', bar: '#4A80C4' },
  { bg: '#FFF0F6', flap: '#FFD6E8', bar: '#D45E8A' },
  { bg: '#FEFAEC', flap: '#FAF0CC', bar: '#B8922A' },
]

function getPastel(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff
  return PASTELS[h % PASTELS.length]
}

function fmtMonth(ym: string) {
  const [, m] = ym.split('-').map(Number)
  return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]
}

interface BarData { key: string; label: string; amount: number }

function BarChart({ data, currentMonth, barColor }: { data: BarData[]; currentMonth: string; barColor: string }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map(d => d.amount), 1)
  const H = 48
  const barW = 22
  const gap = 5
  const totalW = data.length * (barW + gap) - gap

  return (
    <div style={{ overflowX: 'auto', marginBottom: 10, WebkitOverflowScrolling: 'touch' }}>
      <svg width={Math.max(totalW, 60)} height={H + 22} style={{ display: 'block', overflow: 'visible' }}>
        {data.map((d, i) => {
          const x = i * (barW + gap)
          const bh = d.amount > 0 ? Math.max(4, Math.round((d.amount / max) * H)) : 4
          const y = H - bh
          const isCurrent = d.key === currentMonth
          return (
            <g key={d.key}>
              <rect x={x} y={y} width={barW} height={bh} rx={5}
                fill={isCurrent ? barColor : 'rgba(0,0,0,0.1)'}
                opacity={d.amount === 0 ? 0.35 : 1}
              />
              {d.amount > 0 && (
                <text x={x + barW / 2} y={y - 3} textAnchor="middle"
                  fontSize={7} fill="#9B8E86" fontWeight="700">
                  {d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : Math.round(d.amount)}
                </text>
              )}
              <text x={x + barW / 2} y={H + 14} textAnchor="middle"
                fontSize={8} fontWeight={isCurrent ? '700' : '400'}
                fill={isCurrent ? '#2A2018' : '#BDB5B0'}>
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
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
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')

  const p = getPastel(c.id)
  const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.savedAmount / c.targetAmount) * 100)) : 0
  const done = pct >= 100
  const ml = c.deadline ? monthsLeft(c.deadline) : null
  const currentMonth = new Date().toISOString().slice(0, 7)
  const history = c.monthlyHistory || {}

  // Chart data: Prior bar (if any) + all history months sorted oldest→newest + current month if missing
  const histKeys = Object.keys(history).sort()
  const displayKeys = histKeys.includes(currentMonth) ? histKeys : [...histKeys, currentMonth]
  const chartData: BarData[] = [
    ...((c.baseAmount ?? 0) > 0 ? [{ key: 'base', label: 'Prior', amount: c.baseAmount! }] : []),
    ...displayKeys.map(m => ({ key: m, label: fmtMonth(m), amount: history[m] ?? 0 })),
  ]

  const currentEntry = history[currentMonth]
  const hasCurrentEntry = currentEntry !== undefined

  const confirmEdit = () => {
    const v = parseFloat(editVal)
    if (!isNaN(v) && v >= 0) onSetMonthAmount(c.id, currentMonth, v)
    setEditing(false)
  }

  return (
    <div
      onClick={() => { if (!editing) setIsOpen(o => !o) }}
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
      {/* Flap */}
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

        {/* Open */}
        {isOpen && (
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', marginTop: 10 }}>

            {/* Progress */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="num" style={{ fontSize: 13, fontWeight: 700, color: '#1A1614' }}>{c.savedAmount.toFixed(0)}</span>
              <span className="num" style={{ fontSize: 10, color: '#9B8E86' }}>/ {c.targetAmount.toFixed(0)} TND</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.09)', borderRadius: 99, height: 4, marginBottom: 4 }}>
              <div style={{ background: done ? '#4A8C5C' : p.bar, borderRadius: 99, height: 4, width: `${pct}%`, transition: 'width 0.4s' }} />
            </div>
            {done && <p style={{ fontSize: 9, color: '#4A8C5C', fontWeight: 700, margin: '0 0 4px' }}>✓ Goal reached!</p>}
            {!done && ml !== null && ml >= 0 && (
              <p style={{ fontSize: 9, color: ml <= 2 ? p.bar : '#9B8E86', margin: '0 0 4px', fontWeight: 600 }}>
                {ml === 0 ? 'This month!' : `${ml} months left`}
              </p>
            )}

            <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)', margin: '6px 0 8px' }} />

            {/* Bar chart */}
            <BarChart data={chartData} currentMonth={currentMonth} barColor={p.bar} />

            {/* Current month input row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ flex: 1, fontSize: 10, fontWeight: 700, color: '#2A2018' }}>
                {fmtMonth(currentMonth)} {new Date().getFullYear()}
              </span>
              {editing ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input
                    type="text" inputMode="decimal" value={editVal}
                    onChange={e => setEditVal(e.target.value.replace(/[^0-9.]/g, ''))}
                    onBlur={confirmEdit}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditing(false) }}
                    autoFocus
                    onClick={e => e.stopPropagation()}
                    style={{ width: 62, border: 'none', outline: 'none', background: 'rgba(0,0,0,0.08)', borderRadius: 7, padding: '5px 7px', fontSize: 12, fontWeight: 700, textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 9, color: '#9B8E86', fontWeight: 600 }}>TND</span>
                </div>
              ) : hasCurrentEntry ? (
                <button onClick={e => { e.stopPropagation(); setEditVal(String(currentEntry)); setEditing(true) }}
                  style={{ border: 'none', background: 'rgba(0,0,0,0.06)', borderRadius: 7, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span className="num" style={{ fontSize: 12, fontWeight: 700, color: '#2A2018' }}>{currentEntry.toFixed(0)}</span>
                  <span style={{ fontSize: 9, color: '#9B8E86', fontWeight: 600 }}>TND</span>
                </button>
              ) : (
                <button onClick={e => { e.stopPropagation(); setEditVal(''); setEditing(true) }}
                  style={{ border: 'none', background: p.bar, borderRadius: 7, padding: '4px 12px', cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'white', lineHeight: 1 }}>+</span>
                </button>
              )}
            </div>

            <div style={{ height: '0.5px', background: 'rgba(0,0,0,0.08)', margin: '0 0 6px' }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
              <button onClick={e => { e.stopPropagation(); onToggleEssential(c.id) }}
                style={{ padding: '4px 8px', borderRadius: 7, border: 'none', background: 'rgba(0,0,0,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={10} fill={c.isEssential ? p.bar : 'none'} color={c.isEssential ? p.bar : '#BDB5B0'} />
                {c.isEssential && <span style={{ fontSize: 9, fontWeight: 700, color: p.bar }}>Essential</span>}
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
