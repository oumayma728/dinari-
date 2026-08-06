'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  defaultCategoryId?: string
  prefill?: { amount?: number; description?: string; categoryId?: string; type?: 'income' | 'expense' }
  onAdd: (tx: { type: 'income' | 'expense'; amount: number; date: string; description: string; categoryId: string }) => void
  onClose: () => void
}

export default function AddTransactionModal({ categories, prefill, onAdd, onClose }: Props) {
  const [type, setType]         = useState<'income' | 'expense'>(prefill?.type || 'expense')
  const [amount, setAmount]     = useState(prefill?.amount ? String(prefill.amount) : '')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [desc, setDesc]         = useState(prefill?.description || '')
  const [catId, setCatId]       = useState(prefill?.categoryId || categories[0]?.id || '')

  const submit = () => {
    const n = parseFloat(amount)
    if (!n || n <= 0 || !catId) return
    onAdd({ type, amount: n, date, description: desc || (categories.find(c => c.id === catId)?.name || ''), categoryId: catId })
    onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(26,22,20,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        background: 'var(--card)', borderRadius: '24px 24px 0 0',
        padding: '8px 20px calc(32px + env(safe-area-inset-bottom))',
      }}>
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)', margin: '12px auto 20px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' }}>Add transaction</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="var(--muted)" />
          </button>
        </div>

        {/* Type toggle */}
        <div style={{ display: 'flex', background: 'var(--bg)', borderRadius: 14, padding: 4, marginBottom: 18 }}>
          {(['expense', 'income'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: '10px', borderRadius: 11, border: 'none', cursor: 'pointer',
              background: type === t ? 'white' : 'transparent',
              color: type === t ? (t === 'expense' ? 'var(--pink)' : 'var(--success)') : 'var(--muted)',
              fontWeight: type === t ? 700 : 400, fontSize: 14,
              boxShadow: type === t ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.12s',
            }}>
              {t === 'expense' ? '− Expense' : '+ Income'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 14, padding: '14px 18px', marginBottom: 12 }}>
          <input
            type="text" inputMode="decimal" value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} autoFocus placeholder="0"
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', color: 'var(--text)' }}
          />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>TND</span>
        </div>

        {/* Description */}
        <input
          value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description"
          style={{ ...{ width: '100%', padding: '13px 16px', borderRadius: 14, border: 'none', background: 'var(--bg)', fontSize: 15, color: 'var(--text)', outline: 'none', marginBottom: 12 } }}
        />

        {/* Date */}
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: 14, border: 'none', background: 'var(--bg)', fontSize: 14, color: 'var(--text)', outline: 'none', marginBottom: 16, width: '100%' }}
        />

        {/* Category */}
        <p className="label" style={{ margin: '0 0 8px' }}>Category</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCatId(c.id)} style={{
              padding: '8px 14px', borderRadius: 100, border: 'none', cursor: 'pointer',
              background: catId === c.id ? 'var(--pink)' : 'var(--bg)',
              color: catId === c.id ? 'white' : 'var(--text)',
              fontSize: 13, fontWeight: catId === c.id ? 700 : 400,
              transition: 'all 0.12s',
            }}>
              {c.icon} {c.name}
            </button>
          ))}
          {categories.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0 }}>Add categories first →</p>
          )}
        </div>

        <button onClick={submit} className="btn-pink" disabled={!amount || !catId}>
          Save
        </button>
      </div>
    </div>
  )
}
