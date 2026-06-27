'use client'
import { useState, useEffect } from 'react'
import { Trash2, Search, X, Download } from 'lucide-react'
import { loadData, deleteTransaction, addTransaction, getMonthStats, getCategorySpending, exportToCSV } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import MonthNav from '@/components/MonthNav'
import { CategoryBarChart } from '@/components/Charts'
import { format } from 'date-fns'

export default function Transactions() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(new Date())

  useEffect(() => { setData(loadData()) }, [])

  if (!data) return null

  const { income, expenses, balance } = getMonthStats(data, month)
  const categorySpend = getCategorySpending(data, month)

  const categoryChartData = Object.entries(categorySpend)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => {
      const cat = data.categories.find(c => c.name === name)
      return { name, icon: cat?.icon || '📦', amount: Math.round(amount as number), color: cat?.color || '#F5F5F5' }
    })

  const monthTxs = data.transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
  })

  const filtered = monthTxs.filter(tx => {
    const matchFilter = filter === 'all' || tx.type === filter
    const matchSearch = !search || tx.description.toLowerCase().includes(search.toLowerCase()) || tx.category.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const handleDelete = (id: string) => { deleteTransaction(id); setData(loadData()) }
  const handleAdd = (txData: { amount: number; type: string; category: string; description: string; date: string }) => {
    addTransaction({ ...txData, type: txData.type as 'income' | 'expense' })
    setData(loadData())
    setShowAdd(false)
  }

  const handleExport = () => {
    const csv = exportToCSV(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'dinari-transactions.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 0', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Transactions</h1>
          <button onClick={handleExport} style={{ background: 'none', border: '0.5px solid var(--border)', borderRadius: 20, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
            <Download size={13} /> CSV
          </button>
        </div>

        <MonthNav month={month} onChange={setMonth} />

        {/* Summary */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: 'rgba(107,143,113,0.1)', borderRadius: 14, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--success)', margin: '0 0 2px' }}>Income</p>
            <p className="amount-font" style={{ fontSize: 17, fontWeight: 600, color: 'var(--success)', margin: 0 }}>+{income.toFixed(0)}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(196,115,106,0.1)', borderRadius: 14, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--danger)', margin: '0 0 2px' }}>Spent</p>
            <p className="amount-font" style={{ fontSize: 17, fontWeight: 600, color: 'var(--danger)', margin: 0 }}>-{expenses.toFixed(0)}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(61,90,92,0.08)', borderRadius: 14, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: 'var(--primary)', margin: '0 0 2px' }}>Net</p>
            <p className="amount-font" style={{ fontSize: 17, fontWeight: 600, color: 'var(--primary)', margin: 0 }}>{balance >= 0 ? '+' : ''}{balance.toFixed(0)}</p>
          </div>
        </div>

        {/* Category chart */}
        {categoryChartData.length > 0 && (
          <div className="card" style={{ padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>Spending by category</p>
            <CategoryBarChart data={categoryChartData} />
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            style={{ width: '100%', padding: '11px 36px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, outline: 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4 }}>
              <X size={16} color="var(--text-muted)" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', background: 'var(--border)', borderRadius: 12, padding: 3, marginBottom: 14 }}>
          {(['all', 'expense', 'income'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: '8px', borderRadius: 10, border: 'none',
              background: filter === f ? 'white' : 'transparent',
              color: filter === f ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: filter === f ? 500 : 400, fontSize: 13,
            }}>
              {f === 'all' ? 'All' : f === 'expense' ? 'Expenses' : 'Income'}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 24, margin: '0 0 8px' }}>📭</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{search ? 'No results found' : 'No transactions this month'}</p>
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
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{tx.category} · {format(new Date(tx.date), 'dd MMM yyyy')}</p>
                  </div>
                  <span className="amount-font" style={{ fontSize: 14, fontWeight: 500, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
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

      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom) + 16px)', right: 20,
        width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', border: 'none', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(212,163,115,0.4)', zIndex: 40, fontSize: 24,
      }}>+</button>

      {showAdd && <AddTransactionModal categories={data.categories} onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
