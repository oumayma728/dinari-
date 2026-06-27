'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface Props {
  month: Date
  onChange: (d: Date) => void
}

export default function MonthNav({ month, onChange }: Props) {
  const prev = () => { const d = new Date(month); d.setMonth(d.getMonth() - 1); onChange(d) }
  const next = () => {
    const d = new Date(month); d.setMonth(d.getMonth() + 1)
    if (d <= new Date()) onChange(d)
  }
  const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear()

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
      <button onClick={prev} style={{ background: 'white', border: '0.5px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeft size={18} color="var(--text)" />
      </button>
      <span style={{ fontSize: 15, fontWeight: 600, minWidth: 130, textAlign: 'center' }}>
        {format(month, 'MMMM yyyy')}
      </span>
      <button onClick={next} disabled={isCurrentMonth} style={{ background: 'white', border: '0.5px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isCurrentMonth ? 0.3 : 1 }}>
        <ChevronRight size={18} color="var(--text)" />
      </button>
    </div>
  )
}
