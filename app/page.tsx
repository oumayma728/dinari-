'use client'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Check, Pencil, Trash2 } from 'lucide-react'
import { loadData, saveData, calcStats, getCategorySpent, isThisMonth } from '@/lib/storage'
import { AppData, Challenge } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import AddTransactionModal from '@/components/AddTransactionModal'
import { format } from 'date-fns'

export default function Home() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showChallengeForm, setShowChallengeForm] = useState(false)
  const [cName, setCName] = useState('')
  const [cTarget, setCTarget] = useState('')
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null)
  const [editSaved, setEditSaved] = useState('')

  useEffect(() => { setData(loadData()) }, [])

  const stats = useMemo(() => data ? calcStats(data) : null, [data])

  if (!data || !stats) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  const addChallenge = () => {
    if (!cName.trim() || !cTarget) return
    const c: Challenge = { id: crypto.randomUUID(), name: cName.trim(), targetAmount: parseFloat(cTarget), savedAmount: 0, active: true }
    persist({ ...data, challenges: [...data.challenges, c] })
    setCName(''); setCTarget(''); setShowChallengeForm(false)
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
            <button onClick={() => setShowAdd(true)} style={{
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(196,96,122,0.25)',
              border: 'none', color: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <Plus size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Balance */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', margin: '0 0 4px' }}>Balance</p>
            <p className="num" style={{ color: 'white', fontSize: 38, fontWeight: 700, margin: 0, letterSpacing: '-1.5px', lineHeight: 1 }}>
              {data.balance.toFixed(0)}<span style={{ fontSize: 16, fontWeight: 500, opacity: 0.5, marginLeft: 6 }}>TND</span>
            </p>
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

        {/* ── SALARY INPUT (if not set) ── */}
        {data.salary === 0 && (
          <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 10px' }}>Set your monthly salary to calculate planned remaining</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number" inputMode="decimal" placeholder="Your salary (TND)"
                className="field" style={{ flex: 1 }}
                onBlur={e => { const v = parseFloat(e.target.value); if (v > 0) persist({ ...data, salary: v }) }}
              />
            </div>
          </div>
        )}

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
            <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Challenge name (e.g. Save 100 TND this month)"
              className="field" style={{ marginBottom: 8 }} autoFocus />
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '0 14px', marginBottom: 10 }}>
              <input type="number" inputMode="decimal" value={cTarget} onChange={e => setCTarget(e.target.value)} placeholder="Target amount"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 16, fontWeight: 600, padding: '12px 0' }} />
              <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowChallengeForm(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={addChallenge} className="btn-pink" style={{ flex: 2 }} disabled={!cName.trim() || !cTarget}>Add</button>
            </div>
          </div>
        )}

        {data.challenges.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            {data.challenges.map(c => {
              const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.savedAmount / c.targetAmount) * 100)) : 0
              const done = pct >= 100
              const isEditing = editingChallenge === c.id
              return (
                <div key={c.id} className="card" style={{ padding: '14px 16px', opacity: c.active ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: done ? 0 : 10 }}>
                    {/* Tick */}
                    <button onClick={() => toggleChallenge(c.id)} style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0, cursor: 'pointer', border: 'none',
                      background: c.active ? (done ? 'var(--success)' : 'var(--pink)') : 'var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {c.active && <Check size={13} color="white" strokeWidth={3} />}
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{c.name}</p>
                      <p className="num" style={{ fontSize: 12, color: 'var(--muted)', margin: '1px 0 0' }}>
                        {c.savedAmount.toFixed(0)} / {c.targetAmount.toFixed(0)} TND · {pct}%
                      </p>
                    </div>
                    <button onClick={() => { setEditingChallenge(isEditing ? null : c.id); setEditSaved(String(c.savedAmount)) }}
                      style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                      <Pencil size={14} color="var(--faint)" />
                    </button>
                    <button onClick={() => deleteChallenge(c.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                      <Trash2 size={14} color="var(--faint)" />
                    </button>
                  </div>

                  {!done && (
                    <div style={{ background: 'var(--bg)', borderRadius: 99, height: 5 }}>
                      <div style={{ background: done ? 'var(--success)' : 'var(--pink)', borderRadius: 99, height: 5, width: `${pct}%`, transition: 'width 0.4s' }} />
                    </div>
                  )}
                  {done && <p style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, margin: '6px 0 0' }}>✓ Challenge complete!</p>}

                  {isEditing && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 10, padding: '0 12px' }}>
                        <input type="number" inputMode="decimal" value={editSaved} onChange={e => setEditSaved(e.target.value)}
                          placeholder="Saved so far" style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, padding: '10px 0' }} autoFocus />
                        <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
                      </div>
                      <button onClick={() => { updateSaved(c.id, parseFloat(editSaved) || 0); setEditingChallenge(null) }}
                        style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--pink)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Save
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
          onAdd={tx => { persist({ ...data, transactions: [{ ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...data.transactions] }) }}
          onClose={() => setShowAdd(false)}
        />
      )}

      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
