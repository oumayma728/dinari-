'use client'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, Expense, ExpenseType, Priority } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const PRI_OPTS: Priority[] = ['high', 'medium', 'low']
const PRI_LABEL: Record<Priority, string> = { high: 'H', medium: 'M', low: 'L' }
const PRI_COLOR: Record<Priority, string> = { high: 'var(--success)', medium: 'var(--warning)', low: 'var(--faint)' }

const SECTIONS: { type: ExpenseType; title: string; subtitle: string; showPriority: boolean }[] = [
  { type: 'fixed',    title: 'Fixed',    subtitle: 'Same every month — rent, utilities, uni', showPriority: false },
  { type: 'one-time', title: 'One-time', subtitle: 'This month only — doctor, event, trip',   showPriority: false },
  { type: 'variable', title: 'Variable', subtitle: 'Groceries, gym, shopping, skincare…',     showPriority: true  },
]

export default function ExpensesPage() {
  const [data, setData]       = useState<AppData | null>(null)
  const [adding, setAdding]   = useState<ExpenseType | null>(null)
  const [name, setName]       = useState('')
  const [amount, setAmount]   = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  const resetForm = () => { setName(''); setAmount(''); setPriority('medium') }

  const openAdding = (type: ExpenseType) => {
    if (adding === type) { setAdding(null); resetForm() }
    else { setAdding(type); resetForm() }
  }

  const add = () => {
    if (!name.trim() || !amount || !adding) return
    const exp: Expense = {
      id: crypto.randomUUID(),
      name: name.trim(),
      amount: parseFloat(amount),
      type: adding,
      priority: adding === 'variable' ? priority : 'high',
    }
    persist({ ...data, expenses: [...data.expenses, exp], insights: null })
    resetForm()
    setAdding(null)
  }

  const remove = (id: string) =>
    persist({ ...data, expenses: data.expenses.filter(e => e.id !== id), insights: null })

  const updatePriority = (id: string, p: Priority) =>
    persist({ ...data, expenses: data.expenses.map(e => e.id === id ? { ...e, priority: p } : e), insights: null })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 28px', letterSpacing: '-0.8px' }}>Expenses</h1>

        {SECTIONS.map(({ type, title, subtitle, showPriority }) => {
          const items = data.expenses.filter(e => e.type === type)
          const total = items.reduce((s, e) => s + e.amount, 0)
          const isAdding = adding === type

          return (
            <div key={type} style={{ marginBottom: 28 }}>
              {/* Section header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
                <div>
                  <p className="label" style={{ margin: '0 0 2px' }}>{title}</p>
                  <p style={{ fontSize: 12, color: 'var(--faint)', margin: 0, fontWeight: 500 }}>{subtitle}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {items.length > 0 && (
                    <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
                      {total.toFixed(0)} TND
                    </span>
                  )}
                  <button
                    onClick={() => openAdding(type)}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
                      background: isAdding ? 'var(--pink-light)' : 'var(--pink)',
                      color: isAdding ? 'var(--pink)' : 'white',
                      fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isAdding ? '×' : '+'}
                  </button>
                </div>
              </div>

              {/* Inline add form — only shown for the active section */}
              {isAdding && (
                <div className="card" style={{ padding: '14px', marginBottom: 8 }}>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={
                      type === 'fixed'    ? 'e.g. Rent, University fee' :
                      type === 'one-time' ? 'e.g. Doctor visit, Event' :
                                            'e.g. Groceries, Gym, Skincare'
                    }
                    autoFocus
                    style={{
                      width: '100%', border: 'none', outline: 'none', background: 'var(--pink-faint)',
                      borderRadius: 10, padding: '11px 13px', fontSize: 15, marginBottom: 8,
                    }}
                  />

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--pink-faint)', borderRadius: 10, padding: '0 13px' }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && add()}
                        placeholder="Amount"
                        style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 16, fontWeight: 700, padding: '11px 0', letterSpacing: '-0.3px' }}
                      />
                      <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
                    </div>

                    {showPriority && (
                      <div style={{ display: 'flex', gap: 4 }}>
                        {PRI_OPTS.map(p => (
                          <button
                            key={p}
                            onClick={() => setPriority(p)}
                            style={{
                              width: 36, height: 42, borderRadius: 8, border: 'none', cursor: 'pointer',
                              fontSize: 11, fontWeight: 700,
                              background: priority === p ? 'var(--pink)' : 'var(--pink-faint)',
                              color: priority === p ? 'white' : 'var(--faint)',
                            }}
                          >
                            {PRI_LABEL[p]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={add}
                    disabled={!name.trim() || !amount}
                    className="btn"
                    style={{
                      background: name.trim() && amount ? 'var(--pink)' : 'var(--pink-light)',
                      color:      name.trim() && amount ? 'white'       : 'var(--faint)',
                    }}
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Expense list */}
              {items.length > 0 ? (
                <div className="card" style={{ overflow: 'hidden' }}>
                  {items.map((e, i) => (
                    <div key={e.id} style={{ padding: '13px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

                        {showPriority && (
                          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                            {PRI_OPTS.map(p => (
                              <button
                                key={p}
                                onClick={() => updatePriority(e.id, p)}
                                style={{
                                  width: 20, height: 20, borderRadius: 4, border: 'none', cursor: 'pointer',
                                  fontSize: 8, fontWeight: 700,
                                  background: e.priority === p ? 'var(--pink)' : 'var(--pink-faint)',
                                  color: e.priority === p ? 'white' : 'var(--faint)',
                                }}
                              >
                                {PRI_LABEL[p]}
                              </button>
                            ))}
                          </div>
                        )}

                        <p style={{ flex: 1, fontSize: 14, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.name}
                        </p>

                        {showPriority && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: PRI_COLOR[e.priority], flexShrink: 0 }}>
                            {e.priority.toUpperCase()}
                          </span>
                        )}

                        <span className="num" style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, marginLeft: 4 }}>
                          {e.amount.toFixed(0)}
                        </span>

                        <button onClick={() => remove(e.id)} style={{ background: 'none', border: 'none', padding: '0 0 0 6px', cursor: 'pointer', flexShrink: 0 }}>
                          <Trash2 size={14} color="var(--faint)" />
                        </button>
                      </div>

                      {data.insights?.expenses?.[e.id] && (
                        <p className="insight">{data.insights.expenses[e.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !isAdding && (
                  <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0, fontWeight: 500, paddingLeft: 2 }}>
                    No {title.toLowerCase()} yet
                  </p>
                )
              )}
            </div>
          )
        })}
      </div>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
