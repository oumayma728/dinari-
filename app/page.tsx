'use client'
import { useState, useEffect } from 'react'
import { Plus, Target } from 'lucide-react'
import { loadData, addTransaction, getMonthStats, getCategorySpending } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import VoiceButton from '@/components/VoiceButton'
import { format } from 'date-fns'

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => { setData(loadData()) }, [])

  if (!data) return <div style={{ padding: 20, color: 'var(--text-muted)' }}>Loading...</div>

  const { income, expenses, balance } = getMonthStats(data)
  const categorySpend = getCategorySpending(data)
  const recentTx = data.transactions.slice(0, 5)

  const handleAdd = (txData: { amount: number; type: string; category: string; description: string; date: string }) => {
    addTransaction({ ...txData, type: txData.type as 'income' | 'expense', date: txData.date || new Date().toISOString().split('T')[0] })
    setData(loadData())
  }

  const handleVoice = (txData: { amount: number; type: string; category: string; description: string }) => {
    addTransaction({ ...txData, type: txData.type as 'income' | 'expense', date: new Date().toISOString().split('T')[0] })
    setData(loadData())
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Sbah el khir' : hour < 18 ? 'Msa el khir' : 'Bonsoir'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 0', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{greeting} ✦</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '2px 0 0', color: 'var(--text)' }}>{data.name}</h1>
        </div>

        {/* Balance card */}
        <div style={{
          background: 'var(--primary)', borderRadius: 24, padding: 22, marginBottom: 16,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '0 0 4px' }}>
            Balance — {format(new Date(), 'MMMM yyyy')}
          </p>
          <p className="amount-font" style={{ color: 'white', fontSize: 34, fontWeight: 600, margin: '0 0 16px' }}>
            <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.7 }}>TND </span>
            {balance.toFixed(3)}
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>Income</p>
              <p className="amount-font" style={{ color: '#A8D5B0', fontSize: 15, fontWeight: 500, margin: 0 }}>+{income.toFixed(3)}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>Spent</p>
              <p className="amount-font" style={{ color: '#F5A898', fontSize: 15, fontWeight: 500, margin: 0 }}>-{expenses.toFixed(3)}</p>
            </div>
            {data.goals[0] && (
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>Goal</p>
                <p className="amount-font" style={{ color: '#D4A373', fontSize: 15, fontWeight: 500, margin: 0 }}>
                  {Math.round((data.goals[0].savedAmount / data.goals[0].targetAmount) * 100)}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active goal */}
        {data.goals[0] && (
          <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Target size={14} color="var(--accent)" />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{data.goals[0].icon} {data.goals[0].name}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500 }}>
                {Math.round((data.goals[0].savedAmount / data.goals[0].targetAmount) * 100)}%
              </span>
            </div>
            <div style={{ background: 'var(--border)', borderRadius: 99, height: 6 }}>
              <div style={{
                background: 'var(--accent)', borderRadius: 99, height: 6,
                width: `${Math.min(100, (data.goals[0].savedAmount / data.goals[0].targetAmount) * 100)}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{data.goals[0].savedAmount} TND saved</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Goal: {data.goals[0].targetAmount} TND</span>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {Object.keys(categorySpend).length > 0 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '16px 0 10px' }}>This month</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {Object.entries(categorySpend).slice(0, 4).map(([cat, amount]) => {
                const catObj = data.categories.find(c => c.name === cat)
                return (
                  <div key={cat} className="card" style={{ padding: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: catObj?.color || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 8 }}>
                      {catObj?.icon || '📦'}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px' }}>{cat}</p>
                    <p className="amount-font" style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
                      {(amount as number).toFixed(0)} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>TND</span>
                    </p>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Recent transactions */}
        <p style={{ fontSize: 14, fontWeight: 500, margin: '16px 0 10px' }}>Recent</p>
        {recentTx.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>🌱</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              No transactions yet.<br />Say something or tap + to start!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTx.map(tx => {
              const catObj = data.categories.find(c => c.name === tx.category)
              return (
                <div key={tx.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: catObj?.color || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {catObj?.icon || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{tx.category} · {format(new Date(tx.date), 'dd MMM')}</p>
                  </div>
                  <span className="amount-font" style={{ fontSize: 14, fontWeight: 500, flexShrink: 0, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(0)} TND
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Voice button */}
        <div style={{ margin: '24px 0 16px', display: 'flex', justifyContent: 'center' }}>
          <VoiceButton categories={data.categories} onTransaction={handleVoice} />
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom) + 16px)',
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
