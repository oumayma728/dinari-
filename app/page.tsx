'use client'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Check, Pencil, Trash2 } from 'lucide-react'
import { loadData, saveData, calcStats, getCategorySpent, isThisMonth, updateStreak } from '@/lib/storage'
import { AppData, Challenge } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import { format } from 'date-fns'

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [cName, setCName] = useState('')
  const [cIcon, setCIcon] = useState('')
  const [cTarget, setCTarget] = useState('')
  const [cDeadline, setCDeadline] = useState('')
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null)
  const [editSaved, setEditSaved] = useState('')
  const [editingSalary, setEditingSalary] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const [editingCarryover, setEditingCarryover] = useState(false)
  const [carryoverInput, setCarryoverInput] = useState('')

  useEffect(() => { setData(loadData()) }, [])

  const stats = useMemo(() => data ? calcStats(data) : null, [data])

  if (!data || !stats) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  const addChallenge = () => {
    if (!cName.trim() || !cTarget) return
    const c: Challenge = {
      id: crypto.randomUUID(),
      name: cName.trim(),
      icon: cIcon.trim() || '🎯',
      targetAmount: parseFloat(cTarget),
      savedAmount: 0,
      active: true,
      deadline: cDeadline || undefined,
    }
    persist({ ...data, challenges: [...data.challenges, c] })
    setCName(''); setCIcon(''); setCTarget(''); setCDeadline(''); setShowChallengeForm(false)
  }

  const monthsLeft = (deadline: string) => {
    const [y, m] = deadline.split('-').map(Number)
    const now = new Date()
    return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1))
  }

  const toggleChallenge = (id: string) =>
    persist({ ...data, challenges: data.challenges.map(c => c.id === id ? { ...c, active: !c.active } : c) })

  const updateSaved = (id: string, val: number) =>
    persist({ ...data, challenges: data.challenges.map(c => c.id === id ? { ...c, savedAmount: Math.max(0, Math.min(c.targetAmount, val)) } : c) })

  const deleteChallenge = (id: string) =>
    persist({ ...data, challenges: data.challenges.filter(c => c.id !== id) })

  const recentTx = data.transactions
    .filter(t => isThisMonth(t.date))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const activeCategories = [...data.categories]
    .filter(c => c.activeThisMonth)
    .sort((a, b) => a.priority - b.priority)

  const planned = stats.plannedRemaining
  const actual = stats.actualRemaining
  const month = format(new Date(), 'MMMM yyyy')

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        {/* ── BALANCE CARD ── */}
        <div style={{
          background: '#1C2A2B', borderRadius: 24, padding: '24px 24px 22px',
          marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(196,96,122,0.12)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -10, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 6px' }}>
                {month}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 500, margin: 0 }}>{data.name}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {data.streak > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: '5px 10px' }}>
                  <span style={{ fontSize: 14 }}>🔥</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{data.streak} day{data.streak > 1 ? 's' : ''}</span>
                </div>
              )}
            <button onClick={() => setShowAdd(true)} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(196,96,122,0.25)',
              border: 'none', color: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Salary + Carryover → computed balance */}
          <div style={{ marginBottom: 20 }}>
            {/* Two inputs side by side */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {/* Salary */}
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 5px' }}>Salary</p>
                {editingSalary ? (
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '0 10px' }}>
                    <input
                      type="number" inputMode="decimal" value={salaryInput}
                      onChange={e => setSalaryInput(e.target.value)}
                      autoFocus
                      onBlur={() => { const v = parseFloat(salaryInput); if (!isNaN(v)) persist({ ...data, salary: v }); setEditingSalary(false) }}
                      onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat(salaryInput); if (!isNaN(v)) persist({ ...data, salary: v }); setEditingSalary(false) } }}
                      style={{ width: '100%', border: 'none', outline: 'none', background: 'none', color: 'white', fontSize: 18, fontWeight: 700, padding: '8px 0' }}
                    />
                  </div>
                ) : (
                  <p
                    className="num"
                    onClick={() => { setSalaryInput(String(data.salary || '')); setEditingSalary(true) }}
                    style={{ color: 'white', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.8px', cursor: 'pointer' }}
                  >
                    {data.salary.toFixed(0)}<span style={{ fontSize: 12, opacity: 0.45, marginLeft: 4 }}>TND</span>
                  </p>
                )}
              </div>

              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />

              {/* Carryover */}
              <div style={{ flex: 1 }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 5px' }}>From last month</p>
                {editingCarryover ? (
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '0 10px' }}>
                    <input
                      type="number" inputMode="decimal" value={carryoverInput}
                      onChange={e => setCarryoverInput(e.target.value)}
                      autoFocus
                      onBlur={() => { const v = parseFloat(carryoverInput) || 0; persist({ ...data, carryover: v }); setEditingCarryover(false) }}
                      onKeyDown={e => { if (e.key === 'Enter') { const v = parseFloat(carryoverInput) || 0; persist({ ...data, carryover: v }); setEditingCarryover(false) } }}
                      style={{ width: '100%', border: 'none', outline: 'none', background: 'none', color: 'white', fontSize: 18, fontWeight: 700, padding: '8px 0' }}
                    />
                  </div>
                ) : (
                  <p
                    className="num"
                    onClick={() => { setCarryoverInput(String(data.carryover || '')); setEditingCarryover(true) }}
                    style={{ color: data.carryover > 0 ? '#7EC8A0' : 'rgba(255,255,255,0.35)', fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.8px', cursor: 'pointer' }}
                  >
                    {data.carryover > 0 ? '+' : ''}{(data.carryover || 0).toFixed(0)}<span style={{ fontSize: 12, opacity: 0.5, marginLeft: 4 }}>TND</span>
                  </p>
                )}
              </div>
            </div>

            {/* Computed balance */}
            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: 0 }}>
                Total balance
              </p>
              <p className="num" style={{ color: 'white', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-1px' }}>
                {stats.balance.toFixed(0)}<span style={{ fontSize: 13, fontWeight: 500, opacity: 0.5, marginLeft: 5 }}>TND</span>
              </p>
            </div>
          </div>

          {/* Planned vs Actual */}
          <div style={{ display: 'flex', gap: 0, borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: 16 }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', margin: '0 0 4px' }}>Planned left</p>
              <p className="num" style={{ color: planned >= 0 ? '#7EC8A0' : '#F5A898', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                {planned >= 0 ? '' : '−'}{Math.abs(planned).toFixed(0)} TND
              </p>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 20px' }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 600, letterSpacing: '0.3px', textTransform: 'uppercase', margin: '0 0 4px' }}>Actual left</p>
              <p className="num" style={{ color: actual >= 0 ? '#7EC8A0' : '#F5A898', fontSize: 18, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>
                {actual >= 0 ? '' : '−'}{Math.abs(actual).toFixed(0)} TND
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
                const barColor = pct >= 90 ? 'var(--pink)' : pct >= 70 ? 'var(--warning)' : 'var(--success)'
                return (
                  <div key={cat.id} className="card" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: cat.budget > 0 ? 10 : 0 }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.icon}</span>
                      <p style={{ flex: 1, fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{cat.name}</p>
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
                    <p className="num" style={{ fontSize: 14, fontWeight: 700, margin: 0, flexShrink: 0, color: tx.type === 'income' ? 'var(--success)' : 'var(--pink)' }}>
                      {tx.type === 'income' ? '+' : '−'}{tx.amount.toFixed(0)}
                    </p>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── CHALLENGES ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p className="label" style={{ margin: 0 }}>Saving challenges</p>
          <button onClick={() => setShowChallengeForm(s => !s)} style={{
            width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: showChallengeForm ? 'var(--pink-light)' : 'var(--pink)', color: showChallengeForm ? 'var(--pink)' : 'white',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {showChallengeForm ? '×' : '+'}
          </button>
        </div>

        {showChallengeForm && (
          <div className="card" style={{ padding: '14px', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={cIcon} onChange={e => setCIcon(e.target.value)} placeholder="🎯"
                style={{ width: 46, border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 10, padding: '10px 0', fontSize: 20, textAlign: 'center' }} />
              <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Goal name (e.g. New Laptop)"
                className="field" style={{ flex: 1, marginBottom: 0 }} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '0 14px' }}>
                <input type="number" inputMode="decimal" value={cTarget} onChange={e => setCTarget(e.target.value)} placeholder="Target amount"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 15, fontWeight: 600, padding: '11px 0' }} />
                <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
              </div>
              <input type="month" value={cDeadline} onChange={e => setCDeadline(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 12, padding: '11px 14px', fontSize: 13, color: cDeadline ? 'var(--text)' : 'var(--faint)', fontWeight: 500 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowChallengeForm(false); setCName(''); setCIcon(''); setCTarget(''); setCDeadline('') }} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={addChallenge} className="btn-pink" style={{ flex: 2 }} disabled={!cName.trim() || !cTarget}>Add goal</button>
            </div>
          </div>
        )}

        {data.challenges.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 4 }}>
            {data.challenges.map(c => {
              const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.savedAmount / c.targetAmount) * 100)) : 0
              const done = pct >= 100
              const isEditing = editingChallenge === c.id
              const ml = c.deadline ? monthsLeft(c.deadline) : null
              const remaining = c.targetAmount - c.savedAmount
              const monthly = ml && ml > 0 ? remaining / ml : null
              const weekly = monthly ? monthly / 4.33 : null
              const circ = 2 * Math.PI * 18

              return (
                <div key={c.id} className="card" style={{ padding: '16px', opacity: c.active ? 1 : 0.55 }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    {/* SVG progress circle */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <svg width={52} height={52}>
                        <circle cx={26} cy={26} r={18} fill="none" stroke="var(--bg)" strokeWidth={4.5} />
                        <circle cx={26} cy={26} r={18} fill="none"
                          stroke={done ? 'var(--success)' : 'var(--pink)'}
                          strokeWidth={4.5} strokeLinecap="round"
                          strokeDasharray={circ}
                          strokeDashoffset={circ * (1 - pct / 100)}
                          style={{ transform: 'rotate(-90deg)', transformOrigin: '26px 26px', transition: 'stroke-dashoffset 0.5s' }}
                        />
                        <text x={26} y={30} textAnchor="middle" fontSize={9} fontWeight={700}
                          fill={done ? 'var(--success)' : 'var(--text)'}>
                          {pct}%
                        </text>
                      </svg>
                      {/* icon badge */}
                      <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 14, lineHeight: 1 }}>
                        {c.icon || '🎯'}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{c.name}</p>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button onClick={() => { setEditingChallenge(isEditing ? null : c.id); setEditSaved(String(c.savedAmount)) }}
                            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                            <Pencil size={13} color="var(--faint)" />
                          </button>
                          <button onClick={() => deleteChallenge(c.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                            <Trash2 size={13} color="var(--faint)" />
                          </button>
                        </div>
                      </div>

                      <p className="num" style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
                        {c.savedAmount.toFixed(0)} / {c.targetAmount.toFixed(0)} TND
                      </p>

                      {/* deadline + monthly breakdown */}
                      {!done && (ml !== null || monthly) && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                          {ml !== null && ml >= 0 && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: ml <= 2 ? 'var(--pink)' : 'var(--muted)', background: 'var(--bg)', borderRadius: 6, padding: '2px 7px' }}>
                              {ml === 0 ? 'This month' : `${ml} month${ml > 1 ? 's' : ''} left`}
                            </span>
                          )}
                          {monthly !== null && (
                            <span className="num" style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', background: 'var(--bg)', borderRadius: 6, padding: '2px 7px' }}>
                              {monthly.toFixed(0)} TND/mo · {weekly!.toFixed(0)} TND/wk
                            </span>
                          )}
                        </div>
                      )}

                      {done && (
                        <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, margin: '4px 0 0' }}>✓ Goal reached!</p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {!done && (
                    <div style={{ background: 'var(--bg)', borderRadius: 99, height: 4, marginTop: 12 }}>
                      <div style={{ background: 'var(--pink)', borderRadius: 99, height: 4, width: `${pct}%`, transition: 'width 0.5s' }} />
                    </div>
                  )}

                  {/* Edit saved amount */}
                  {isEditing && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 10, padding: '0 12px' }}>
                        <input type="number" inputMode="decimal" value={editSaved} onChange={e => setEditSaved(e.target.value)}
                          placeholder="Saved so far" style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, padding: '10px 0' }} autoFocus />
                        <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
                      </div>
                      <button onClick={() => { updateSaved(c.id, parseFloat(editSaved) || 0); setEditingChallenge(null) }}
                        style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--pink)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Update
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          !showChallengeForm && (
            <p style={{ fontSize: 13, color: 'var(--faint)', textAlign: 'center', padding: '16px 0', fontWeight: 500 }}>
              No challenges yet — tap + to set a savings goal
            </p>
          )
        )}
      </div>

      {showAdd && (
        <AddTransactionModal
          categories={data.categories}
          onAdd={tx => { const next = updateStreak({ ...data, transactions: [{ ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...data.transactions] }); persist(next) }}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
