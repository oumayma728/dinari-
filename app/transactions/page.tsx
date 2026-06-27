'use client'
import { useState, useEffect } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { loadData, deleteTransaction, addTransaction, getMonthStats } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import { format } from 'date-fns'

export default function Transactions() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')

  useEffect(() => { setData(loadData()) }, [])

  if (!data) return null

  const { income, expenses } = getMonthStats(data)

  const filtered = data.transactions.filter(tx =>
    filter === 'all' ? true : tx.type === filter
  )

  const handleDelete = (id: string) => {
    deleteTransaction(id)
    setData(loadData())
  }

  const handleAdd = (txData: { amount: number; type: string; category: string; description: string; date: string }) => {
    addTransaction({ ...txData, type: txData.type as 'income' | 'expense', date: txData.date })
    setData(loadData())
    setShowAdd(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 0', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 16px' }}>Transactions</h1>

        {/* Summary pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'rgba(107,143,113,0.1)', borderRadius: 14, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--success)', margin: '0 0 2px' }}>Income</p>
            <p className="amount-font" style={{ fontSize: 18, fontWeight: 600, color: 'var(--success)', margin: 0 }}>+{income.toFixed(0)}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(196,115,106,0.1)', borderRadius: 14, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--danger)', margin: '0 0 2px' }}>Spent</p>
            <p className="amount-font" style={{ fontSize: 18, fontWeight: 600, color: 'var(--danger)', margin: 0 }}>-{expenses.toFixed(0)}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', background: 'var(--border)', borderRadius: 12, padding: 3, marginBottom: 16 }}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none',
              background: filter === f ? 'white' : 'transparent',
              color: filter === f ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: filter === f ? 500 : 400, fontSize: 13,
              textTransform: 'capitalize',
            }}>
              {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 24, margin: '0 0 8px' }}>📭</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>No transactions here yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(tx => {
              const catObj = data.categories.find(c => c.name === tx.category)
              return (
                <div key={tx.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: catObj?.color || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {catObj?.icon || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      {tx.category} · {format(new Date(tx.date), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <span className="amount-font" style={{ fontSize: 14, fontWeight: 500, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(0)} TND
                  </span>
                  <button onClick={() => handleDelete(tx.id)} style={{ background: 'none', border: 'none', padding: 4, flexShrink: 0 }}>
                    <Trash2 size={16} color="var(--text-muted)" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom) + 16px)',
          right: 20, width: 52, height: 52, borderRadius: '50%',
          background: 'var(--accent)', border: 'none', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(212,163,115,0.4)', zIndex: 40, fontSize: 24,
        }}
      >
        +
      </button>

      {showAdd && <AddTransactionModal categories={data.categories} onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
