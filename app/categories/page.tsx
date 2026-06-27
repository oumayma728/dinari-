'use client'
import { useState, useEffect } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { loadData, saveData, getCategorySpent } from '@/lib/storage'
import { AppData, Category, CategoryType } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const EMOJIS = ['🛒','🚌','💡','💊','🎬','☕','🍕','💻','🏠','✈️','🎁','📱','⚽','🎵','🛍','💰','🎓','🐾','💄','🏋️']
const TYPE_LABEL: Record<CategoryType, string> = { fixed: 'Fixed', variable: 'Variable', 'one-time': 'One-time' }
const TYPE_COLOR: Record<CategoryType, string> = { fixed: 'var(--success)', variable: 'var(--warning)', 'one-time': 'var(--pink)' }

export default function CategoriesPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🛒')
  const [type, setType] = useState<CategoryType>('variable')
  const [budget, setBudget] = useState('')

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  const addCategory = () => {
    if (!name.trim()) return
    const n = data.categories.length
    const cat: Category = {
      id: crypto.randomUUID(), name: name.trim(), icon, type,
      budget: parseFloat(budget) || 0,
      priority: n + 1,
      activeThisMonth: true,
    }
    persist({ ...data, categories: [...data.categories, cat] })
    setName(''); setIcon('🛒'); setType('variable'); setBudget(''); setShowAdd(false)
  }

  const toggleActive = (id: string) =>
    persist({ ...data, categories: data.categories.map(c => c.id === id ? { ...c, activeThisMonth: !c.activeThisMonth } : c) })

  const updateBudget = (id: string, val: string) =>
    persist({ ...data, categories: data.categories.map(c => c.id === id ? { ...c, budget: parseFloat(val) || 0 } : c) })

  const updatePriority = (id: string, val: number) => {
    const n = data.categories.length
    const clamped = Math.max(1, Math.min(n, val))
    persist({ ...data, categories: data.categories.map(c => c.id === id ? { ...c, priority: clamped } : c) })
  }

  const deleteCategory = (id: string) =>
    persist({ ...data, categories: data.categories.filter(c => c.id !== id) })

  const sorted = [...data.categories].sort((a, b) => a.priority - b.priority)
  const n = data.categories.length

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.7px' }}>Categories</h1>
          <button onClick={() => setShowAdd(s => !s)} style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none', cursor: 'pointer', marginTop: 2,
            background: showAdd ? 'var(--pink-light)' : 'var(--pink)', color: showAdd ? 'var(--pink)' : 'white',
            fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: showAdd ? 'none' : '0 4px 12px rgba(196,96,122,0.3)',
          }}>
            {showAdd ? '×' : '+'}
          </button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 20px', fontWeight: 500 }}>
          Tick categories active this month. Priority 1 = most important.
        </p>

        {/* Add form */}
        {showAdd && (
          <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', letterSpacing: '-0.3px' }}>New category</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Category name" autoFocus
              className="field" style={{ marginBottom: 10 }} />

            {/* Emoji picker */}
            <p className="label" style={{ margin: '0 0 7px' }}>Icon</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setIcon(e)} style={{
                  width: 36, height: 36, borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 18,
                  background: icon === e ? 'var(--pink)' : 'var(--bg)',
                  filter: icon === e ? 'none' : 'grayscale(0.2)',
                }}>{e}</button>
              ))}
            </div>

            {/* Type */}
            <p className="label" style={{ margin: '0 0 7px' }}>Type</p>
            <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
              {(['fixed', 'variable', 'one-time'] as CategoryType[]).map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  flex: 1, padding: '9px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: type === t ? 700 : 400,
                  background: type === t ? 'var(--pink)' : 'var(--bg)',
                  color: type === t ? 'white' : 'var(--muted)',
                }}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            {/* Budget */}
            <p className="label" style={{ margin: '0 0 7px' }}>Monthly budget (TND)</p>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '0 14px', marginBottom: 14 }}>
              <input type="number" inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 18, fontWeight: 700, padding: '12px 0' }} />
              <span style={{ fontSize: 13, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={addCategory} className="btn-pink" style={{ flex: 2 }} disabled={!name.trim()}>Add</button>
            </div>
          </div>
        )}

        {/* Category list */}
        {sorted.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <p style={{ fontSize: 28, margin: '0 0 10px' }}>🏷️</p>
            <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>No categories yet — tap + to add one</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map(cat => {
            const spent = getCategorySpent(data, cat.id)
            const left = cat.budget - spent
            const expanded = expandedId === cat.id
            return (
              <div key={cat.id} className="card" style={{ overflow: 'hidden', opacity: cat.activeThisMonth ? 1 : 0.55 }}>
                {/* Main row */}
                <div
                  onClick={() => setExpandedId(expanded ? null : cat.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                >
                  {/* Tick */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleActive(cat.id) }}
                    style={{
                      width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: cat.activeThisMonth ? 'var(--pink)' : 'var(--bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {cat.activeThisMonth && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.icon}</span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{cat.name}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLOR[cat.type], letterSpacing: '0.2px', textTransform: 'uppercase' }}>
                        {TYPE_LABEL[cat.type]}
                      </span>
                    </div>
                    {cat.budget > 0 && (
                      <p className="num" style={{ fontSize: 11, color: 'var(--faint)', margin: '1px 0 0', fontWeight: 500 }}>
                        {left.toFixed(0)} left · {cat.budget.toFixed(0)} TND budget
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--faint)', margin: '0 0 1px' }}>PRIORITY</p>
                    <p className="num" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--pink)' }}>#{cat.priority}</p>
                  </div>
                </div>

                {/* Expanded editor */}
                {expanded && (
                  <div style={{ padding: '0 16px 16px', borderTop: '0.5px solid var(--border)' }}>
                    <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

                      {/* Budget */}
                      <div>
                        <p className="label" style={{ margin: '0 0 6px' }}>Monthly budget</p>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 11, padding: '0 14px' }}>
                          <input type="number" inputMode="decimal" defaultValue={cat.budget || ''}
                            onBlur={e => updateBudget(cat.id, e.target.value)} placeholder="0"
                            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 17, fontWeight: 700, padding: '11px 0' }} />
                          <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
                        </div>
                      </div>

                      {/* Priority slider */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <p className="label" style={{ margin: 0 }}>Priority</p>
                          <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--pink)' }}>
                            #{cat.priority} of {n}
                          </span>
                        </div>
                        <input
                          type="range" min={1} max={Math.max(1, n)} step={1}
                          value={cat.priority}
                          onChange={e => updatePriority(cat.id, parseInt(e.target.value))}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                          <span style={{ fontSize: 10, color: 'var(--faint)', fontWeight: 600 }}>Most important</span>
                          <span style={{ fontSize: 10, color: 'var(--faint)', fontWeight: 600 }}>Least</span>
                        </div>
                      </div>

                      {/* Type */}
                      <div>
                        <p className="label" style={{ margin: '0 0 6px' }}>Type</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(['fixed', 'variable', 'one-time'] as CategoryType[]).map(t => (
                            <button key={t} onClick={() => persist({ ...data, categories: data.categories.map(c => c.id === cat.id ? { ...c, type: t } : c) })}
                              style={{
                                flex: 1, padding: '8px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                fontSize: 11, fontWeight: cat.type === t ? 700 : 400,
                                background: cat.type === t ? 'var(--pink)' : 'var(--bg)',
                                color: cat.type === t ? 'white' : 'var(--muted)',
                              }}>
                              {TYPE_LABEL[t]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button onClick={() => deleteCategory(cat.id)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, border: 'none', background: '#FEE8E8', color: '#C4736A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        <Trash2 size={14} /> Delete category
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
