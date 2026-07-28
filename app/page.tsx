'use client'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  loadData, saveData, calcStats, getCategorySpent, isThisMonth,
  updateStreak, updateSafeStreak, getSafeToSpend,
} from '@/lib/storage'

import { AppData, IncomeSource } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import { format } from 'date-fns'

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Income form
  const [showIncomeForm, setShowIncomeForm] = useState(false)
  const [incName, setIncName] = useState('')
  const [incAmount, setIncAmount] = useState('')
  const [incDay, setIncDay] = useState('1')

  // Carryover
  const [editingCarryover, setEditingCarryover] = useState(false)
  const [carryoverInput, setCarryoverInput] = useState('')

  // Income inline edit
  const [editingIncome, setEditingIncome] = useState<string | null>(null)
  const [incEditAmount, setIncEditAmount] = useState('')

  useEffect(() => {
    let d = loadData()
    d = updateSafeStreak(d)
    saveData(d)
    setData(d)
  }, [])

  const stats = useMemo(() => data ? calcStats(data) : null, [data])
  const safeInfo = useMemo(() => data ? getSafeToSpend(data) : null, [data])

  if (!data || !stats || !safeInfo) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  // ── Income handlers ──
  const addIncome = () => {
    if (!incName.trim() || !incAmount) return
    const src: IncomeSource = {
      id: crypto.randomUUID(),
      name: incName.trim(),
      amount: parseFloat(incAmount),
      day: parseInt(incDay) || 1,
      received: false,
    }
    persist({ ...data, incomeSources: [...data.incomeSources, src] })
    setIncName(''); setIncAmount(''); setIncDay('1'); setShowIncomeForm(false)
  }

  const toggleReceived = (id: string) =>
    persist({ ...data, incomeSources: data.incomeSources.map(s => s.id === id ? { ...s, received: !s.received } : s) })

  const deleteIncome = (id: string) =>
    persist({ ...data, incomeSources: data.incomeSources.filter(s => s.id !== id) })

  const saveIncomeEdit = (id: string) => {
    const v = parseFloat(incEditAmount)
    if (!isNaN(v) && v >= 0)
      persist({ ...data, incomeSources: data.incomeSources.map(s => s.id === id ? { ...s, amount: v } : s) })
    setEditingIncome(null)
  }

  const recentTx = data.transactions
    .filter(t => isThisMonth(t.date))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const activeCategories = [...data.categories]
    .filter(c => c.activeThisMonth)
    .sort((a, b) => a.priority - b.priority)

  const month = format(new Date(), 'MMMM yyyy')
  const { safe, raw, unpaidFixed, challengeReserved } = safeInfo
  const safePositive = raw >= 0
  const safeCardBg = safePositive ? 'rgba(126,200,160,0.15)' : 'rgba(245,168,152,0.15)'
  const safeCardBorder = safePositive ? 'rgba(126,200,160,0.3)' : 'rgba(245,168,152,0.3)'
  const safeColor = safePositive ? '#7EC8A0' : '#F5A898'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        {/* ── BALANCE CARD ── */}
        <div style={{
          background: '#1C2A2B', borderRadius: 24, padding: '20px 20px 18px',
          marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(196,96,122,0.12)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>{month}</p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500, margin: 0 }}>{data.name}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {data.streak > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '4px 9px' }}>
                  <span style={{ fontSize: 12 }}>🔥</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{data.streak}d</span>
                </div>
              )}
              {data.safeStreak > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(126,200,160,0.2)', borderRadius: 20, padding: '4px 9px' }}>
                  <span style={{ fontSize: 12 }}>🛡️</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7EC8A0' }}>{data.safeStreak}mo</span>
                </div>
              )}
              <button onClick={() => setShowAdd(true)} style={{
                width: 32, height: 32, borderRadius: '50%', background: 'rgba(196,96,122,0.25)',
                border: 'none', color: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}>
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Safe to spend hero */}
          <div style={{
            background: safeCardBg,
            border: `1px solid ${safeCardBorder}`,
            borderRadius: 16, padding: '14px 16px', marginBottom: 16,
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Safe to spend today
            </p>
            <p className="num" style={{ color: safeColor, fontSize: 30, fontWeight: 700, margin: 0, letterSpacing: '-1.2px', lineHeight: 1 }}>
              {raw < 0 ? '−' : ''}{Math.abs(safe).toFixed(0)}<span style={{ fontSize: 13, fontWeight: 500, opacity: 0.6, marginLeft: 5 }}>TND</span>
            </p>
            {(challengeReserved > 0 || unpaidFixed > 0) && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: '6px 0 0', lineHeight: 1.5 }}>
                Already excludes
                {challengeReserved > 0 ? ` ${challengeReserved.toFixed(0)} TND in envelopes` : ''}
                {challengeReserved > 0 && unpaidFixed > 0 ? ' +' : ''}
                {unpaidFixed > 0 ? ` ${unpaidFixed.toFixed(0)} TND unpaid bills` : ''}
              </p>
            )}
          </div>

          {/* Income sources */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 8px' }}>Income</p>

            {data.incomeSources.length === 0 && !showIncomeForm && (
              <button onClick={() => setShowIncomeForm(true)} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)',
                borderRadius: 10, padding: '10px 14px', width: '100%',
                color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
              }}>
                + Add income source (salary, CIVP…)
              </button>
            )}

            {data.incomeSources.map(src => (
              <div key={src.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                <button onClick={() => toggleReceived(src.id)} style={{
                  width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0,
                  background: src.received ? '#7EC8A0' : 'transparent',
                  boxShadow: src.received ? 'none' : '0 0 0 1.5px rgba(255,255,255,0.3)',
                }} />
                <p style={{ flex: 1, fontSize: 13, fontWeight: 500, margin: 0, color: src.received ? 'white' : 'rgba(255,255,255,0.5)' }}>
                  {src.name}
                  {!src.received && (
                    <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.4 }}>expected {src.day}{src.day === 1 ? 'st' : src.day === 2 ? 'nd' : src.day === 3 ? 'rd' : 'th'}</span>
                  )}
                </p>
                {editingIncome === src.id ? (
                  <input
                    type="number" inputMode="decimal" value={incEditAmount}
                    onChange={e => setIncEditAmount(e.target.value)}
                    onBlur={() => saveIncomeEdit(src.id)}
                    onKeyDown={e => { if (e.key === 'Enter') saveIncomeEdit(src.id); if (e.key === 'Escape') setEditingIncome(null) }}
                    autoFocus
                    style={{ width: 72, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.15)', borderRadius: 7, padding: '4px 7px', fontSize: 13, fontWeight: 700, color: 'white', textAlign: 'right' }}
                  />
                ) : (
                  <p className="num" onClick={() => { setEditingIncome(src.id); setIncEditAmount(String(src.amount)) }}
                    style={{ fontSize: 13, fontWeight: 700, margin: 0, color: src.received ? '#7EC8A0' : 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {src.amount.toFixed(0)} TND
                    <Pencil size={9} color="rgba(255,255,255,0.2)" />
                  </p>
                )}
                <button onClick={() => deleteIncome(src.id)} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer' }}>
                  <Trash2 size={11} color="rgba(255,255,255,0.2)" />
                </button>
              </div>
            ))}

            {data.incomeSources.length > 0 && !showIncomeForm && (
              <button onClick={() => setShowIncomeForm(true)} style={{ background: 'none', border: 'none', padding: '6px 0 0', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                + Add source
              </button>
            )}

            {showIncomeForm && (
              <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: '10px 12px', marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
                  <input value={incName} onChange={e => setIncName(e.target.value)} placeholder="Name (e.g. Salary)"
                    style={{ flex: 2, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'white' }} autoFocus />
                  <input type="number" inputMode="decimal" value={incAmount} onChange={e => setIncAmount(e.target.value)} placeholder="Amount"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'white' }} />
                  <input type="number" inputMode="numeric" value={incDay} onChange={e => setIncDay(e.target.value)} placeholder="Day"
                    style={{ width: 44, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 6px', fontSize: 13, color: 'white', textAlign: 'center' }} />
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => { setShowIncomeForm(false); setIncName(''); setIncAmount(''); setIncDay('1') }}
                    style={{ flex: 1, padding: '7px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={addIncome} disabled={!incName.trim() || !incAmount}
                    style={{ flex: 2, padding: '7px', borderRadius: 8, border: 'none', background: 'var(--pink)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: (!incName.trim() || !incAmount) ? 0.5 : 1 }}>
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Carryover */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: 0, flexShrink: 0 }}>Carryover</p>
            {editingCarryover ? (
              <input
                type="number" inputMode="decimal" value={carryoverInput}
                onChange={e => setCarryoverInput(e.target.value)} autoFocus
                onBlur={() => { const v = parseFloat(carryoverInput) || 0; persist({ ...data, carryover: v }); setEditingCarryover(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat(carryoverInput) || 0; persist({ ...data, carryover: v }); setEditingCarryover(false) } }}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: 'white', fontSize: 14, fontWeight: 600 }}
              />
            ) : (
              <p className="num" onClick={() => { setCarryoverInput(String(data.carryover || '')); setEditingCarryover(true) }}
                style={{ margin: 0, color: data.carryover > 0 ? '#7EC8A0' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {data.carryover > 0 ? '+' : ''}{(data.carryover || 0).toFixed(0)} TND
              </p>
            )}
          </div>

          {/* Total balance */}
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: 0 }}>Total balance</p>
            <p className="num" style={{ color: 'white', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-1px' }}>
              {stats.balance.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 500, opacity: 0.5, marginLeft: 5 }}>TND</span>
            </p>
          </div>

          {/* Planned / Actual */}
          <div style={{ display: 'flex', borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', margin: '0 0 4px' }}>Planned left</p>
              <p className="num" style={{ color: stats.plannedRemaining >= 0 ? '#7EC8A0' : '#F5A898', fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                {stats.plannedRemaining >= 0 ? '' : '−'}{Math.abs(stats.plannedRemaining).toFixed(0)} TND
              </p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', margin: '0 0 4px' }}>Actual left</p>
              <p className="num" style={{ color: stats.actualRemaining >= 0 ? '#7EC8A0' : '#F5A898', fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                {stats.actualRemaining >= 0 ? '' : '−'}{Math.abs(stats.actualRemaining).toFixed(0)} TND
              </p>
            </div>
          </div>
        </div>

        {/* ── ACTIVE CATEGORIES ── */}
        {activeCategories.length > 0 && (
          <>
            <p className="label" style={{ margin: '0 0 10px' }}>This month</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {activeCategories.map(cat => {
                const spent = getCategorySpent(data, cat.id)
                const left = cat.budget - spent
                const pct = cat.budget > 0 ? Math.min(100, Math.round((spent / cat.budget) * 100)) : 0
                const barColor = pct >= 90 ? 'var(--pink)' : pct >= 70 ? '#F5A898' : '#7EC8A0'
                return (
                  <div key={cat.id} className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cat.budget > 0 ? 10 : 0 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.icon}</span>
                      <p style={{ flex: 1, fontSize: 14, fontWeight: 600, margin: 0 }}>{cat.name}</p>
                      <div style={{ textAlign: 'right' }}>
                        <p className="num" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{left.toFixed(0)} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted)' }}>left</span></p>
                        <p className="num" style={{ fontSize: 11, color: 'var(--faint)', margin: '1px 0 0' }}>{spent.toFixed(0)} / {cat.budget.toFixed(0)} TND</p>
                      </div>
                    </div>
                    {cat.budget > 0 && (
                      <div style={{ background: 'var(--bg)', borderRadius: 99, height: 5 }}>
                        <div style={{ background: barColor, borderRadius: 99, height: 5, width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
        {activeCategories.length === 0 && (
          <div className="card" style={{ padding: '20px', marginBottom: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
              No active categories this month.<br />
              <a href="/categories" style={{ color: 'var(--pink)', fontWeight: 600, textDecoration: 'none' }}>Set up categories →</a>
            </p>
          </div>
        )}

        {/* ── RECENT TRANSACTIONS ── */}
        {recentTx.length > 0 && (
          <>
            <p className="label" style={{ margin: '0 0 10px' }}>Recent</p>
            <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
              {recentTx.map((tx, i) => {
                const cat = data.categories.find(c => c.id === tx.categoryId)
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{cat?.icon || '📦'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description}</p>
                      <p style={{ fontSize: 11, color: 'var(--faint)', margin: '1px 0 0', fontWeight: 500 }}>{cat?.name} · {format(new Date(tx.date), 'dd MMM')}</p>
                    </div>
                    <p className="num" style={{ fontSize: 14, fontWeight: 700, margin: 0, flexShrink: 0, color: tx.type === 'income' ? '#7EC8A0' : 'var(--pink)' }}>
                      {tx.type === 'income' ? '+' : '−'}{tx.amount.toFixed(0)}
                    </p>
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>

      {showAdd && (
        <AddTransactionModal
          categories={data.categories}
          onAdd={tx => {
            const next = updateStreak({ ...data, transactions: [{ ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...data.transactions] })
            persist(next)
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
