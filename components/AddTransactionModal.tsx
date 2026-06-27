'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  onAdd: (data: { amount: number; type: string; category: string; description: string; date: string }) => void
  onClose: () => void
}

export default function AddTransactionModal({ categories, onAdd, onClose }: Props) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0]?.name || '')
  const [desc, setDesc] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const submit = () => {
    const n = parseFloat(amount)
    if (!n || n <= 0) return
    onAdd({ amount: n, type, category, description: desc || category, date })
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(26,22,20,0.35)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, margin: '0 auto',
          background: '#FAFAF8', borderRadius: '28px 28px 0 0',
          padding: '8px 20px calc(32px + env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(26,22,20,0.12)', margin: '12px auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>Add transaction</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(26,22,20,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} color="var(--text-muted)" />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: 'rgba(26,22,20,0.06)', borderRadius: 14, padding: 4, marginBottom: 20 }}>
          {(['expense', 'income'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '9px', borderRadius: 11, border: 'none',
              background: type === t ? 'white' : 'transparent',
              color: type === t ? (t === 'expense' ? 'var(--danger)' : 'var(--success)') : 'var(--text-muted)',
              fontWeight: type === t ? 600 : 400, fontSize: 14,
              boxShadow: type === t ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s',
            }}>
              {t === 'expense' ? '− Expense' : '+ Income'}
            </button>
          ))}
        </div>

        {/* Amount — big and prominent */}
        <div style={{ marginBottom: 16 }}>
          <p className="label" style={{ margin: '0 0 6px' }}>Amount</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, background: 'white', borderRadius: 14, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>TND</span>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.000" inputMode="decimal" autoFocus
              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <p className="label" style={{ margin: '0 0 6px' }}>Description</p>
          <input
            type="text" value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="e.g. Lunch"
            style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: 'none', background: 'white', fontSize: 15, color: 'var(--text)', outline: 'none', boxShadow: 'var(--shadow-sm)' }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <p className="label" style={{ margin: '0 0 8px' }}>Category</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategory(c.name)} style={{
                padding: '7px 13px', borderRadius: 100, border: 'none',
                background: category === c.name ? 'var(--primary)' : 'white',
                color: category === c.name ? 'white' : 'var(--text)',
                fontSize: 13, fontWeight: category === c.name ? 600 : 400,
                boxShadow: category === c.name ? 'none' : 'var(--shadow-sm)',
                transition: 'all 0.12s',
              }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 24 }}>
          <p className="label" style={{ margin: '0 0 6px' }}>Date</p>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: 'white', fontSize: 14, color: 'var(--text)', outline: 'none', boxShadow: 'var(--shadow-sm)' }}
          />
        </div>

        <button onClick={submit} style={{
          width: '100%', padding: '17px', borderRadius: 16, border: 'none',
          background: 'var(--primary)', color: 'white',
          fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px',
          boxShadow: '0 4px 16px rgba(26,46,47,0.3)',
        }}>
          Save
        </button>
      </div>
    </div>
  )
}
