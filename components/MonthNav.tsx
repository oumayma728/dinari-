'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface Props { month: Date; onChange: (d: Date) => void }

export default function MonthNav({ month, onChange }: Props) {
  const prev = () => { const d = new Date(month); d.setDate(1); d.setMonth(d.getMonth() - 1); onChange(d) }
  const next = () => { const d = new Date(month); d.setDate(1); d.setMonth(d.getMonth() + 1); if (d <= new Date()) onChange(d) }
  const isNow = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear()

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
      <button onClick={prev} style={{ width: 30, height: 30, borderRadius: '50%', background: 'white', border: 'none', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={16} color="var(--text-muted)" />
      </button>
      <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px', color: 'var(--text)', minWidth: 120, textAlign: 'center' }}>
        {format(month, 'MMMM yyyy')}
      </span>
      <button onClick={next} disabled={isNow} style={{ width: 30, height: 30, borderRadius: '50%', background: 'white', border: 'none', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isNow ? 0.25 : 1 }}>
        <ChevronRight size={16} color="var(--text-muted)" />
      </button>
    </div>
  )
}
