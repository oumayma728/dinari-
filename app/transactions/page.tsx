'use client'
import { useState, useEffect, useMemo } from 'react'
import { Trash2, Pencil, Plus } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, Transaction } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import { format } from 'date-fns'

export default function TransactionsPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [editTx, setEditTx] = useState<Transaction | null>(null)

  useEffect(() => { setData(loadData()) }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    const sorted = [...data.transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return filter === 'all' ? sorted : sorted.filter(t => t.type === filter)
  }, [data, filter])

  if (!data) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  const addTx = (tx: { type: 'income' | 'expense'; amount: number; date: string; description: string; categoryId: string }) => {
    persist({ ...data, transactions: [{ ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...data.transactions] })
  }

  const deleteTx = (id: string) => persist({ ...data, transactions: data.transactions.filter(t => t.id !== id) })

  const updateTx = (updated: { type: 'income' | 'expense'; amount: number; date: string; description: string; categoryId: string }) => {
    if (!editTx) return
    persist({ ...data, transactions: data.transactions.map(t => t.id === editTx.id ? { ...t, ...updated } : t) })
    setEditTx(null)
  }

  const monthTotal = (type: 'income' | 'expense') => {
    const now = new Date()
    return data.transactions
      .filter(t => t.type === type && new Date(t.date).getMonth() === now.getMonth())
      .reduce((s, t) => s + t.amount, 0)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.7px' }}>Transactions</h1>
          <button onClick={() => setShowAdd(true)} style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--pink)', border: 'none',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(196,96,122,0.3)',
          }}>
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* This month summary */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          <div className="card" style={{ flex: 1, padding: '12px 14px' }}>
            <p className="label" style={{ margin: '0 0 4px' }}>Income</p>
            <p className="num" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--success)' }}>+{monthTotal('income').toFixed(0)}</p>
          </div>
          <div className="card" style={{ flex: 1, padding: '12px 14px' }}>
            <p className="label" style={{ margin: '0 0 4px' }}>Spent</p>
            <p className="num" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--pink)' }}>−{monthTotal('expense').toFixed(0)}</p>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', background: 'var(--card)', borderRadius: 13, padding: 4, marginBottom: 18, boxShadow: 'var(--shadow-sm)' }}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: filter === f ? 'var(--pink)' : 'transparent',
              color: filter === f ? 'white' : 'var(--muted)',
              fontWeight: filter === f ? 700 : 400, fontSize: 13,
              transition: 'all 0.12s',
            }}>
              {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>📭</p>
            <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>No transactions yet</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {filtered.map((tx, i) => {
              const cat = data.categories.find(c => c.id === tx.categoryId)
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{cat?.icon || '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--faint)', margin: '2px 0 0', fontWeight: 500 }}>
                      {cat?.name || 'Uncategorized'} · {format(new Date(tx.date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <p className="num" style={{ fontSize: 14, fontWeight: 700, margin: 0, flexShrink: 0, color: tx.type === 'income' ? 'var(--success)' : 'var(--pink)' }}>
                    {tx.type === 'income' ? '+' : '−'}{tx.amount.toFixed(0)}
                  </p>
                  <button onClick={() => setEditTx(tx)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                    <Pencil size={13} color="var(--faint)" />
                  </button>
                  <button onClick={() => deleteTx(tx.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                    <Trash2 size={13} color="var(--faint)" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {(showAdd || editTx) && (
        <AddTransactionModal
          categories={data.categories}
          prefill={editTx ? { type: editTx.type, amount: editTx.amount, description: editTx.description, categoryId: editTx.categoryId } : undefined}
          onAdd={editTx ? updateTx : addTx}
          onClose={() => { setShowAdd(false); setEditTx(null) }}
        />
      )}

      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
