'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, Expense, ExpenseType, Priority } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const PRI_OPTS: Priority[] = ['high', 'medium', 'low']
const PRI_LABEL: Record<Priority, string> = { high: 'High', medium: 'Med', low: 'Low' }
const PRI_COLOR: Record<Priority, string> = { high: 'var(--success)', medium: 'var(--warning)', low: 'var(--faint)' }

interface AddFormState { name: string; amount: string; priority: Priority }
const emptyForm = (): AddFormState => ({ name: '', amount: '', priority: 'medium' })

export default function ExpensesPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [adding, setAdding] = useState<ExpenseType | null>(null)
  const [form, setForm] = useState<AddFormState>(emptyForm())

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (d: AppData) => { setData({ ...saveData(d) }) }

  const add = () => {
    if (!form.name.trim() || !form.amount || !adding) return
    const exp: Expense = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      amount: parseFloat(form.amount),
      type: adding,
      priority: adding === 'variable' ? form.priority : 'high',
    }
    persist({ ...data, expenses: [...data.expenses, exp], insights: null })
    setForm(emptyForm()); setAdding(null)
  }

  const remove = (id: string) =>
    persist({ ...data, expenses: data.expenses.filter(e => e.id !== id), insights: null })

  const updatePriority = (id: string, priority: Priority) =>
    persist({ ...data, expenses: data.expenses.map(e => e.id === id ? { ...e, priority } : e), insights: null })

  const byType = (type: ExpenseType) => data.expenses.filter(e => e.type === type)
  const total = (type: ExpenseType) => byType(type).reduce((s, e) => s + e.amount, 0)

  const Section = ({
    type, title, subtitle, showPriority,
  }: {
    type: ExpenseType; title: string; subtitle: string; showPriority: boolean
  }) => {
    const items = byType(type)
    const isAdding = adding === type

    return (
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
          <div>
            <p className="label" style={{ margin: '0 0 2px' }}>{title}</p>
            <p style={{ fontSize: 12, color: 'var(--faint)', margin: 0, fontWeight: 500 }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {items.length > 0 && (
              <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
                {total(type).toFixed(0)} TND
              </span>
            )}
            <button
              onClick={() => { setAdding(isAdding ? null : type); setForm(emptyForm()) }}
              style={{ width: 28, height: 28, borderRadius: '50%', background: isAdding ? 'var(--pink-light)' : 'var(--pink)', border: 'none', color: isAdding ? 'var(--pink)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18 }}
            >
              {isAdding ? '×' : '+'}
            </button>
          </div>
        </div>

        {/* Add form */}
        {isAdding && (
          <div className="card" style={{ padding: '14px', marginBottom: 8 }}>
            <input
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={type === 'fixed' ? 'e.g. Rent, University' : type === 'one-time' ? 'e.g. Doctor visit, Event' : 'e.g. Groceries, Gym, Skincare'}
              autoFocus
              style={{ width: '100%', border: 'none', outline: 'none', background: 'var(--pink-faint)', borderRadius: 10, padding: '10px 13px', fontSize: 14, marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: showPriority ? 8 : 0 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--pink-faint)', borderRadius: 10, padding: '0 12px' }}>
                <input
                  type="number" inputMode="decimal" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="Amount"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 15, fontWeight: 600, padding: '10px 0' }}
                />
                <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600 }}>TND</span>
              </div>
              {showPriority && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {PRI_OPTS.map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                      style={{ padding: '8px 10px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', background: form.priority === p ? 'var(--pink)' : 'var(--pink-faint)', color: form.priority === p ? 'white' : 'var(--faint)' }}>
                      {PRI_LABEL[p]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={add}
              disabled={!form.name.trim() || !form.amount}
              className="btn"
              style={{ background: form.name.trim() && form.amount ? 'var(--pink)' : 'var(--pink-light)', color: form.name.trim() && form.amount ? 'white' : 'var(--faint)', marginTop: 8 }}
            >
              Add
            </button>
          </div>
        )}

        {/* Items */}
        {items.length > 0 ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            {items.map((e, i) => (
              <div key={e.id} style={{ padding: '13px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Priority badge — only for variable */}
                  {showPriority && (
                    <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                      {PRI_OPTS.map(p => (
                        <button key={p} onClick={() => updatePriority(e.id, p)}
                          style={{
                            width: 20, height: 20, borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 8, fontWeight: 700,
                            background: e.priority === p ? 'var(--pink)' : 'var(--pink-faint)',
                            color: e.priority === p ? 'white' : 'var(--faint)',
                          }}>
                          {p[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  )}
                  <p style={{ flex: 1, fontSize: 14, fontWeight: 500, margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                {/* AI insight */}
                {data.insights?.expenses?.[e.id] && (
                  <p className="insight">{data.insights.expenses[e.id]}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          !isAdding && (
            <div style={{ padding: '16px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--faint)', margin: 0, fontWeight: 500 }}>
                No {title.toLowerCase()} yet — tap + to add
              </p>
            </div>
          )
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 28px', letterSpacing: '-0.8px' }}>Expenses</h1>

        <Section type="fixed"    title="Fixed"    subtitle="Same every month — rent, utilities, uni" showPriority={false} />
        <Section type="one-time" title="One-time"  subtitle="This month only — doctor, event, trip"   showPriority={false} />
        <Section type="variable" title="Variable"  subtitle="Groceries, gym, shopping, skincare…"     showPriority={true} />

        {data.insights && !Object.keys(data.insights.expenses).length && (
          <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', marginTop: 8 }}>
            Refresh suggestions from the Overview tab to see AI insights here.
          </p>
        )}
      </div>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
