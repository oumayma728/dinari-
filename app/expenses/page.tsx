'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, FixedExpense } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const CATS = ['Rent', 'Utilities', 'University', 'Transport', 'Insurance', 'Subscriptions', 'Loan', 'Other']

export default function ExpensesPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [cat, setCat] = useState('Other')

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (d: AppData) => { saveData(d); setData({ ...d }) }

  const add = () => {
    if (!name.trim() || !amount) return
    const exp: FixedExpense = { id: crypto.randomUUID(), name: name.trim(), amount: parseFloat(amount), category: cat }
    persist({ ...data, fixedExpenses: [...data.fixedExpenses, exp] })
    setName(''); setAmount(''); setCat('Other'); setShowAdd(false)
  }

  const total = data.fixedExpenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.8px' }}>Fixed expenses</h1>
          <button onClick={() => setShowAdd(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--pink)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,96,122,0.3)' }}>
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          These load automatically into every month's plan.
        </p>

        {/* Add form */}
        {showAdd && (
          <div style={{ background: 'white', borderRadius: 18, padding: '18px', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', letterSpacing: '-0.3px' }}>New fixed expense</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Rent, University)"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--pink-faint)', fontSize: 15, outline: 'none', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--pink-faint)', borderRadius: 12, padding: '0 14px' }}>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 15, padding: '12px 0' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>TND</span>
              </div>
              <select value={cat} onChange={e => setCat(e.target.value)}
                style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--pink-faint)', fontSize: 14, color: 'var(--text)', outline: 'none' }}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={add} className="btn-primary" style={{ flex: 2, background: name.trim() && amount ? 'var(--pink)' : 'var(--text-faint)' }}>Save</button>
            </div>
          </div>
        )}

        {/* List */}
        {data.fixedExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>📋</p>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: 'var(--text)', letterSpacing: '-0.2px' }}>No fixed expenses yet</p>
            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>Add rent, utilities, university fees — anything that repeats every month.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 12 }}>
              {data.fixedExpenses.map((e, i) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{e.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '2px 0 0', fontWeight: 500 }}>{e.category}</p>
                  </div>
                  <p className="num" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--pink)' }}>{e.amount.toFixed(0)} TND</p>
                  <button onClick={() => persist({ ...data, fixedExpenses: data.fixedExpenses.filter(x => x.id !== e.id) })} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                    <Trash2 size={15} color="var(--text-faint)" />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 4px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Total fixed / month</span>
              <span className="num" style={{ fontSize: 15, fontWeight: 700, color: 'var(--pink)' }}>{total.toFixed(0)} TND</span>
            </div>
          </>
        )}
      </div>
      <div className="safe-b" />
      <BottomNav />
    </div>
  )
}
