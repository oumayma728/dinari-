'use client'
import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, Target, AlertTriangle, ChevronRight } from 'lucide-react'
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

const MonthlyBarChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.MonthlyBarChart })), { ssr: false, loading: () => <div style={{ height: 160 }} /> })
const DailyAreaChart = dynamic(() => import('@/components/Charts').then(m => ({ default: m.DailyAreaChart })), { ssr: false, loading: () => <div style={{ height: 100 }} /> })

const P = { x: 20, top: 'calc(20px + env(safe-area-inset-top))' }

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null)
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [showAdd, setShowAdd] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)

  useEffect(() => {
    const d = loadData(); setData(d)
    if (needsRecurringCheck(d)) setShowRecurring(true)
  }, [])

  const monthTxs = useMemo(() => data ? getMonthTransactions(data, month) : [], [data, month])
  const stats = useMemo(() => getMonthStats(monthTxs, month), [monthTxs, month])
  const lastMonthTxs = useMemo(() => { if (!data) return []; const lm = new Date(month); lm.setMonth(lm.getMonth() - 1); return getMonthTransactions(data, lm) }, [data, month])
  const lastStats = useMemo(() => { const lm = new Date(month); lm.setMonth(lm.getMonth() - 1); return getMonthStats(lastMonthTxs, lm) }, [lastMonthTxs, month])
  const categorySpend = useMemo(() => getCategorySpending(monthTxs), [monthTxs])
  const allTimeBalance = useMemo(() => data ? getAllTimeBalance(data) : 0, [data])
  const alerts = useMemo(() => data ? getBudgetAlerts(data, categorySpend) : [], [data, categorySpend])
  const monthly6 = useMemo(() => data ? getLast6MonthsStats(data) : [], [data])
  const dailyData = useMemo(() => getDailySpending(monthTxs, month), [monthTxs, month])
  const spendChange = useMemo(() => lastStats.expenses > 0 ? Math.round(((stats.expenses - lastStats.expenses) / lastStats.expenses) * 100) : 0, [stats.expenses, lastStats.expenses])
  const topCat = useMemo(() => Object.entries(categorySpend).sort((a, b) => b[1] - a[1])[0], [categorySpend])
  const sortedCats = useMemo(() => Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 4), [categorySpend])
  const recentTx = useMemo(() => data?.transactions.slice(0, 5) || [], [data])

  if (!data) return <div style={{ padding: 20, color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Sbah el khir' : hour < 18 ? 'Msa el khir' : 'Bonsoir'

  const handleAdd = (tx: { amount: number; type: string; category: string; description: string; date: string }) =>
    setData(addTransaction(data, { ...tx, type: tx.type as 'income' | 'expense' }))
  const handleVoice = (tx: { amount: number; type: string; category: string; description: string }) =>
    setData(addTransaction(data, { ...tx, type: tx.type as 'income' | 'expense', date: new Date().toISOString().split('T')[0] }))
  const handleApply = (ids: string[]) => { setData(applyRecurringTransactions(data, ids)); setShowRecurring(false) }
  const handleSkip = () => { const u = { ...data, lastRecurringCheck: getMonthKey(new Date()) }; saveData(u); setData(u); setShowRecurring(false) }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', paddingBottom: 20 }}>
      <div style={{ padding: `${P.top} ${P.x}px 0` }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>{greeting}</p>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '2px 0 0', letterSpacing: '-0.6px' }}>{data.name}</h1>
          </div>
          <div style={{ textAlign: 'right', paddingTop: 4 }}>
            <p className="label" style={{ margin: '0 0 3px' }}>All-time</p>
            <p className="num" style={{ fontSize: 17, fontWeight: 700, margin: 0, color: allTimeBalance >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {allTimeBalance >= 0 ? '+' : ''}{allTimeBalance.toFixed(0)} TND
            </p>
          </div>
        </div>

        <MonthNav month={month} onChange={setMonth} />

        {/* Balance card */}
        <div style={{
          background: 'var(--primary)', borderRadius: 24, padding: '24px 24px 22px',
          marginBottom: 16, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -10, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Monthly balance
          </p>
          <p className="num" style={{ color: 'white', fontSize: 40, fontWeight: 700, margin: '0 0 20px', letterSpacing: '-1.5px', lineHeight: 1 }}>
            {stats.balance.toFixed(0)}<span style={{ fontSize: 18, fontWeight: 500, opacity: 0.5, marginLeft: 6 }}>TND</span>
          </p>

          <div style={{ display: 'flex', gap: 0, borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
            {[
              { label: 'Income', val: `+${stats.income.toFixed(0)}`, color: '#7EC8A0' },
              { label: 'Spent', val: `-${stats.expenses.toFixed(0)}`, color: '#F4A49A' },
              { label: 'Saved', val: `${stats.savingsRate}%`, color: '#D4A373' },
            ].map((item, i) => (
              <div key={item.label} style={{ flex: 1, paddingLeft: i > 0 ? 16 : 0, borderLeft: i > 0 ? '0.5px solid rgba(255,255,255,0.1)' : 'none', marginLeft: i > 0 ? 16 : 0 }}>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 3px' }}>{item.label}</p>
                <p className="num" style={{ color: item.color, fontSize: 16, fontWeight: 700, margin: 0 }}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div className="card" style={{ padding: '14px 12px' }}>
            <p className="label" style={{ margin: '0 0 5px' }}>Daily avg</p>
            <p className="num" style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>{stats.dailyAvg.toFixed(0)}</p>
            <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: '2px 0 0' }}>TND/day</p>
          </div>
          <div className="card" style={{ padding: '14px 12px' }}>
            <p className="label" style={{ margin: '0 0 5px' }}>vs last mo.</p>
            <p className="num" style={{ fontSize: 18, fontWeight: 700, margin: 0, color: spendChange > 0 ? 'var(--danger)' : spendChange < 0 ? 'var(--success)' : 'var(--text)' }}>
              {spendChange > 0 ? '+' : ''}{spendChange}%
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
              {spendChange > 0 ? <TrendingUp size={9} color="var(--danger)" /> : <TrendingDown size={9} color="var(--success)" />}
              <p style={{ fontSize: 10, color: 'var(--text-faint)', margin: 0 }}>spending</p>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 12px' }}>
            <p className="label" style={{ margin: '0 0 5px' }}>Top</p>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
              {topCat ? topCat[0] : '—'}
            </p>
            <p className="num" style={{ fontSize: 10, color: 'var(--text-faint)', margin: '2px 0 0' }}>
              {topCat ? `${(topCat[1] as number).toFixed(0)} TND` : 'No data'}
            </p>
          </div>
        </div>

        {/* Budget alerts */}
        {alerts.map(a => (
          <div key={a.category.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: a.pct >= 100 ? 'var(--danger-bg)' : '#FDF6EC',
            borderRadius: 14, padding: '12px 14px', marginBottom: 10,
          }}>
            <AlertTriangle size={15} color={a.pct >= 100 ? 'var(--danger)' : 'var(--accent)'} strokeWidth={2.5} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{a.category.icon} {a.category.name} — {a.pct}%</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>{a.spent.toFixed(0)} / {a.limit.toFixed(0)} TND</p>
            </div>
          </div>
        ))}

        {/* Goal */}
        {data.goals[0] && (
          <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{data.goals[0].icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{data.goals[0].name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0' }}>
                    {(data.goals[0].targetAmount - data.goals[0].savedAmount).toFixed(0)} TND to go
                  </p>
                </div>
              </div>
              <span className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
                {Math.round((data.goals[0].savedAmount / data.goals[0].targetAmount) * 100)}%
              </span>
            </div>
            <div style={{ background: 'rgba(26,22,20,0.06)', borderRadius: 99, height: 5 }}>
              <div style={{ background: 'var(--accent)', borderRadius: 99, height: 5, width: `${Math.min(100, (data.goals[0].savedAmount / data.goals[0].targetAmount) * 100)}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {/* Category spending */}
        {sortedCats.length > 0 && (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '20px 0 12px', letterSpacing: '-0.2px' }}>This month</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {sortedCats.map(([cat, amount]) => {
                const catObj = data.categories.find(c => c.name === cat)
                const pct = catObj?.budgetLimit ? Math.round(((amount as number) / catObj.budgetLimit) * 100) : null
                return (
                  <div key={cat} className="card" style={{ padding: '14px 14px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: catObj?.color || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                        {catObj?.icon || '📦'}
                      </div>
                      {pct !== null && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 100 ? 'var(--danger)' : pct >= 70 ? 'var(--accent)' : 'var(--text-faint)' }}>{pct}%</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 2px', fontWeight: 500 }}>{cat}</p>
                    <p className="num" style={{ fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                      {(amount as number).toFixed(0)}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-faint)', marginLeft: 3 }}>TND</span>
                    </p>
                    {catObj?.budgetLimit && (
                      <div style={{ background: 'rgba(26,22,20,0.06)', borderRadius: 99, height: 3, marginTop: 8 }}>
                        <div style={{ background: pct! >= 100 ? 'var(--danger)' : 'var(--accent)', borderRadius: 99, height: 3, width: `${Math.min(100, pct!)}%` }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Charts */}
        {stats.expenses > 0 && (
          <div className="card" style={{ padding: '16px 18px', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.2px' }}>Daily spending</p>
            <DailyAreaChart data={dailyData} />
          </div>
        )}

        <div className="card" style={{ padding: '16px 18px', marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.2px' }}>6-month overview</p>
          <MonthlyBarChart data={monthly6} />
          <div style={{ display: 'flex', gap: 14, marginTop: 10, justifyContent: 'center' }}>
            {[['#7EC8A0', 'Income'], ['#F4A49A', 'Expenses']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent transactions */}
        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.2px' }}>Recent</p>
        {recentTx.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 32, margin: '0 0 10px' }}>🌱</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>No transactions yet<br />Tap + or use voice to start</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {recentTx.map((tx, i) => {
              const catObj = data.categories.find(c => c.name === tx.category)
              return (
                <div key={tx.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                  borderTop: i > 0 ? '0.5px solid var(--border)' : 'none',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: catObj?.color || '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {catObj?.icon || '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>{tx.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 500 }}>{tx.category} · {format(new Date(tx.date), 'dd MMM')}</p>
                  </div>
                  <span className="num" style={{ fontSize: 15, fontWeight: 700, flexShrink: 0, color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)', letterSpacing: '-0.3px' }}>
                    {tx.type === 'income' ? '+' : '−'}{tx.amount.toFixed(0)}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Voice */}
        <div style={{ margin: '28px 0 20px', display: 'flex', justifyContent: 'center' }}>
          <VoiceButton categories={data.categories} onTransaction={handleVoice} />
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} style={{
        position: 'fixed', bottom: 'calc(72px + env(safe-area-inset-bottom) + 16px)', right: 20,
        width: 54, height: 54, borderRadius: '50%', background: 'var(--primary)', border: 'none', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(26,46,47,0.35)', zIndex: 40, fontSize: 28, fontWeight: 300,
      }}>+</button>

      {showAdd && <AddTransactionModal categories={data.categories} onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {showRecurring && data.recurring.filter(r => r.active).length > 0 && (
        <RecurringModal recurring={data.recurring} onApply={handleApply} onSkip={handleSkip} />
      )}
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
