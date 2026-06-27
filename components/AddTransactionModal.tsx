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
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(44,36,32,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 430, margin: '0 auto',
          background: 'var(--bg)', borderRadius: '24px 24px 0 0',
          padding: '24px 20px 40px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Add transaction</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4 }}>
            <X size={22} color="var(--text-muted)" />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: 'var(--border)', borderRadius: 12, padding: 3, marginBottom: 20 }}>
          {(['expense', 'income'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none',
              background: type === t ? 'white' : 'transparent',
              color: type === t ? (t === 'expense' ? 'var(--danger)' : 'var(--success)') : 'var(--text-muted)',
              fontWeight: type === t ? 600 : 400, fontSize: 14,
              transition: 'all 0.15s',
            }}>
              {t === 'expense' ? '− Expense' : '+ Income'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Amount (TND)</label>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.000" inputMode="decimal" autoFocus
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              border: '0.5px solid var(--border)', background: 'white',
              fontSize: 22, fontWeight: 500, color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Description</label>
          <input
            type="text" value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="e.g. Lunch at work"
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              border: '0.5px solid var(--border)', background: 'white',
              fontSize: 15, color: 'var(--text)', outline: 'none',
            }}
          />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {categories.map(c => (
              <button key={c.id} onClick={() => setCategory(c.name)} style={{
                padding: '7px 14px', borderRadius: 20,
                border: `1.5px solid ${category === c.name ? 'var(--primary)' : 'var(--border)'}`,
                background: category === c.name ? 'rgba(61,90,92,0.08)' : 'white',
                color: category === c.name ? 'var(--primary)' : 'var(--text)',
                fontSize: 13, fontWeight: category === c.name ? 500 : 400,
              }}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Date</label>
          <input
            type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{
              padding: '12px 16px', borderRadius: 12,
              border: '0.5px solid var(--border)', background: 'white',
              fontSize: 14, color: 'var(--text)', outline: 'none',
            }}
          />
        </div>

        <button onClick={submit} style={{
          width: '100%', padding: '16px', borderRadius: 16, border: 'none',
          background: 'var(--primary)', color: 'white',
          fontSize: 16, fontWeight: 600,
        }}>
          Save transaction
        </button>
      </div>
    </div>
  )
}
