'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react'
import {
  loadData, saveData, addTransaction, getMonthTransactions, getMonthStats,
  getCategorySpending, getAllTimeBalance, getLast6MonthsStats, getDailySpending,
  getBudgetAlerts, applyRecurringTransactions, needsRecurringCheck, getMonthKey,
} from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import VoiceButton from '@/components/VoiceButton'
import MonthNav from '@/components/MonthNav'
import RecurringModal from '@/components/RecurringModal'
import { format } from 'date-fns'

// Lazy-load heavy chart components — never block first paint
const MonthlyBarChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.MonthlyBarChart })), { ssr: false, loading: () => <div style={{ height: 160 }} /> })
const DailyAreaChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.DailyAreaChart })), { ssr: false, loading: () => <div style={{ height: 100 }} /> })

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null)
  const [month, setMonth] = useState(() => new Date())
  const [showAdd, setShowAdd] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)

  useEffect(() => {
    const d = loadData()
    setData(d)
    if (needsRecurringCheck(d)) setShowRecurring(true)
  }, [])

  // All expensive computations memoized — only recalculate when data/month changes
  const monthTxs = useMemo(() => data ? getMonthTransactions(data, month) : [], [data, month])
  const stats = useMemo(() => getMonthStats(monthTxs, month), [monthTxs, month])
  const lastMonthTxs = useMemo(() => {
    if (!data) return []
    const lm = new Date(month); lm.setMonth(lm.getMonth() - 1)
    return getMonthTransactions(data, lm)
  }, [data, month])
  const lastMonthStats = useMemo(() => getMonthStats(lastMonthTxs, (() => { const d = new Date(month); d.setMonth(d.getMonth() - 1); return d })()), [lastMonthTxs, month])
  const categorySpend = useMemo(() => getCategorySpending(monthTxs), [monthTxs])
  const allTimeBalance = useMemo(() => data ? getAllTimeBalance(data) : 0, [data])
  const alerts = useMemo(() => data ? getBudgetAlerts(data, categorySpend) : [], [data, categorySpend])
  const monthly6 = useMemo(() => data ? getLast6MonthsStats(data) : [], [data])
  const dailyData = useMemo(() => getDailySpending(monthTxs, month), [monthTxs, month])

  const spendChange = useMemo(() => lastMonthStats.expenses > 0
    ? Math.round(((stats.expenses - lastMonthStats.expenses) / lastMonthStats.expenses) * 100)
    : 0, [stats.expenses, lastMonthStats.expenses])

  const topCat = useMemo(() => Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0], [categorySpend])
  const recentTx = useMemo(() => data?.transactions.slice(0, 5) || [], [data])
  const sortedCategories = useMemo(() => Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 4), [categorySpend])

  if (!data) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>Loading...</div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Sbah el khir' : hour < 18 ? 'Msa el khir' : 'Bonsoir'

  const handleAdd = (txData: { amount: number; type: string; category: string; description: string; date: string }) => {
    const updated = addTransaction(data, { ...txData, type: txData.type as 'income' | 'expense' })
    setData(updated)
  }
  const handleVoice = (txData: { amount: number; type: string; category: string; description: string }) => {
    const updated = addTransaction(data, { ...txData, type: txData.type as 'income' | 'expense', date: new Date().toISOString().split('T')[0] })
    setData(updated)
  }
  const handleApplyRecurring = (ids: string[]) => {
    setData(applyRecurringTransactions(data, ids))
    setShowRecurring(false)
  }
  const handleSkipRecurring = () => {
    const updated = { ...data, lastRecurringCheck: getMonthKey(new Date()) }
    saveData(updated); setData(updated); setShowRecurring(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 0', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{greeting} ✦</p>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: '2px 0 0' }}>{data.name}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>All-time</p>
            <p className="amount-font" style={{ fontSize: 16, fontWeight: 600, margin: '2px 0 0', color: allTimeBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {allTimeBalance >= 0 ? '+' : ''}{allTimeBalance.toFixed(0)} TND
            </p>
          </div>
        </div>

        <MonthNav month={month} onChange={setMonth} />

        {/* Balance card */}
        <div style={{ background: 'var(--primary)', borderRadius: 24, padding: 20, marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: '0 0 4px' }}>Monthly balance</p>
          <p className="amount-font" style={{ color: 'white', fontSize: 32, fontWeight: 600, margin: '0 0 14px' }}>
            <span style={{ fontSize: 15, opacity: 0.7 }}>TND </span>{stats.balance.toFixed(3)}
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>Income</p>
              <p className="amount-font" style={{ color: '#A8D5B0', fontSize: 14, fontWeight: 500, margin: 0 }}>+{stats.income.toFixed(0)}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>Spent</p>
              <p className="amount-font" style={{ color: '#F5A898', fontSize: 14, fontWeight: 500, margin: 0 }}>-{stats.expenses.toFixed(0)}</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 2px' }}>Saved</p>
              <p className="amount-font" style={{ color: '#D4A373', fontSize: 14, fontWeight: 500, margin: 0 }}>{stats.savingsRate}%</p>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div className="card" style={{ padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px' }}>Daily avg</p>
            <p className="amount-font" style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{stats.dailyAvg.toFixed(0)}</p>
            <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '2px 0 0' }}>TND/day</p>
          </div>
          <div className="card" style={{ padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px' }}>vs last month</p>
            <p className="amount-font" style={{ fontSize: 15, fontWeight: 600, margin: 0, color: spendChange > 0 ? 'var(--danger)' : spendChange < 0 ? 'var(--success)' : 'var(--text)' }}>
              {spendChange > 0 ? '+' : ''}{spendChange}%
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              {spendChange > 0 ? <TrendingUp size={10} color="var(--danger)" /> : <TrendingDown size={10} color="var(--success)" />}
              <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0 }}>spending</p>
            </div>
          </div>
          <div className="card" style={{ padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '0 0 4px' }}>Top spend</p>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topCat ? topCat[0] : '—'}
            </p>
            <p className="amount-font" style={{ fontSize: 9, color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {topCat ? `${topCat[1].toFixed(0)} TND` : 'No data'}
            </p>
          </div>
        </div>

        {/* Budget alerts */}
        {alerts.map(a => (
          <div key={a.category.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: a.pct >= 100 ? 'rgba(196,115,106,0.1)' : 'rgba(212,163,115,0.1)',
            border: `0.5px solid ${a.pct >= 100 ? 'rgba(196,115,106,0.3)' : 'rgba(212,163,115,0.3)'}`,
            borderRadius: 12, padding: '10px 14px', marginBottom: 8,
          }}>
            <AlertTriangle size={16} color={a.pct >= 100 ? 'var(--danger)' : 'var(--accent)'} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{a.category.icon} {a.category.name}: {a.pct}% of budget</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{a.spent.toFixed(0)} / {a.limit.toFixed(0)} TND</p>
            </div>
          </div>
        ))}

        {/* Goal */}
        {data.goals[0] && (
          <div className="card" style={{ padding: '14px 16px', marginBottom: 14 }}>
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
              <div style={{ background: 'var(--accent)', borderRadius: 99, height: 6, width: `${Math.min(100, (data.goals[0].savedAmount / data.goals[0].targetAmount) * 100)}%`, transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{data.goals[0].savedAmount} TND saved</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Goal: {data.goals[0].targetAmount} TND</span>
            </div>
          </div>
        )}

        {/* Category grid */}
        {sortedCategories.length > 0 && (
          <>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '14px 0 10px' }}>By category</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              {sortedCategories.map(([cat, amount]) => {
                const catObj = data.categories.find(c => c.name === cat)
                const pct = catObj?.budgetLimit ? Math.round(((amount as number) / catObj.budgetLimit) * 100) : null
                return (
                  <div key={cat} className="card" style={{ padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: catObj?.color || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        {catObj?.icon || '📦'}
                      </div>
                      {pct !== null && (
                        <span style={{ fontSize: 10, fontWeight: 500, color: pct >= 100 ? 'var(--danger)' : pct >= 70 ? 'var(--accent)' : 'var(--text-muted)' }}>{pct}%</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 2px' }}>{cat}</p>
                    <p className="amount-font" style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>
                      {(amount as number).toFixed(0)} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>TND</span>
                    </p>
                    {catObj?.budgetLimit && (
                      <div style={{ background: 'var(--border)', borderRadius: 99, height: 3, marginTop: 6 }}>
                        <div style={{ background: pct! >= 100 ? 'var(--danger)' : 'var(--accent)', borderRadius: 99, height: 3, width: `${Math.min(100, pct!)}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Charts — lazy loaded, never block UI */}
        {stats.expenses > 0 && (
          <div className="card" style={{ padding: '14px 16px', marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>Daily spending</p>
            <DailyAreaChart data={dailyData} />
          </div>
        )}

        <div className="card" style={{ padding: '14px 16px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: '0 0 10px' }}>6-month overview</p>
          <MonthlyBarChart data={monthly6} />
          <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#A8D5B0' }} /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Income</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#F5A898' }} /><span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expenses</span></div>
          </div>
        </div>

        {/* Recent */}
        <p style={{ fontSize: 14, fontWeight: 500, margin: '14px 0 10px' }}>Recent</p>
        {recentTx.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 28, margin: '0 0 8px' }}>🌱</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>No transactions yet — say something or tap +</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentTx.map(tx => {
              const catObj = data.categories.find(c => c.name === tx.category)
              return (
                <div key={tx.id} className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: catObj?.color || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{catObj?.icon || '📦'}</div>
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

        <div style={{ margin: '20px 0 16px', display: 'flex', justifyContent: 'center' }}>
          <VoiceButton categories={data.categories} onTransaction={handleVoice} />
        </div>
      </div>

      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: 'calc(80px + env(safe-area-inset-bottom) + 16px)', right: 20,
        width: 52, height: 52, borderRadius: '50%', background: 'var(--accent)', border: 'none', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(212,163,115,0.4)', zIndex: 40, fontSize: 24,
      }}>+</button>

      {showAdd && <AddTransactionModal categories={data.categories} onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {showRecurring && data.recurring.filter(r => r.active).length > 0 && (
        <RecurringModal recurring={data.recurring} onApply={handleApplyRecurring} onSkip={handleSkipRecurring} />
      )}
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
