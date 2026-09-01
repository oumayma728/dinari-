'use client'
import { Challenge } from '@/lib/types'

const PASTELS = [
  { bg: '#FFF0EC', flap: '#FFD9CC', bar: '#E8946A' },
  { bg: '#F3F0FF', flap: '#DDD6FF', bar: '#8B73E8' },
  { bg: '#EDFAF3', flap: '#CCF0DD', bar: '#4A9E6A' },
  { bg: '#EDF4FF', flap: '#CCE0FF', bar: '#4A80C4' },
  { bg: '#FFF0F6', flap: '#FFD6E8', bar: '#D45E8A' },
  { bg: '#FEFAEC', flap: '#FAF0CC', bar: '#B8922A' },
]

export function getPastel(id: string) {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) & 0x7fffffff
  return PASTELS[h % PASTELS.length]
}

interface Props {
  challenge: Challenge
  onOpen: (id: string) => void
}

export default function EnvelopeCard({ challenge: c, onOpen }: Props) {
  const p = getPastel(c.id)
  const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.savedAmount / c.targetAmount) * 100)) : 0

  return (
    <div
      onClick={() => onOpen(c.id)}
      style={{
        background: p.bg,
        borderRadius: 18,
        cursor: 'pointer',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(26,22,20,0.07)',
        opacity: c.active ? 1 : 0.55,
        userSelect: 'none',
      }}
    >
      {/* Flap */}
      <svg width="100%" viewBox="0 0 100 52" preserveAspectRatio="none" style={{ display: 'block' }}>
        <polygon points="0,0 100,0 100,52 50,32 0,52" fill={p.flap} />
      </svg>

      {/* Body */}
      <div style={{ padding: '0 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -6 }}>
        <span style={{ fontSize: 28, lineHeight: 1, marginBottom: 5 }}>{c.icon || '🎯'}</span>
        <p style={{
          fontSize: 11, fontWeight: 700, margin: '0 0 4px', textAlign: 'center', color: '#2A2018',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%',
        }}>
          {c.name}
        </p>
        <p className="num" style={{ fontSize: 10, color: '#9B8E86', margin: '0 0 6px', fontWeight: 600 }}>
          {c.savedAmount.toFixed(0)} / {c.targetAmount.toFixed(0)} TND
        </p>
        {/* Mini progress bar */}
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.09)', borderRadius: 99, height: 3 }}>
          <div style={{ background: pct >= 100 ? '#4A8C5C' : p.bar, borderRadius: 99, height: 3, width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}
