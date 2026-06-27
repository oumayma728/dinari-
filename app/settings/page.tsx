'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, Category, Goal, RecurringTransaction } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const EMOJI_OPTIONS = ['🥗','🚌','🛒','🛍','💊','🎬','💡','💰','📦','☕','🍕','💇','🎓','💻','🏠','✈️','🎁','🐾','📱','⚽','🎵','🍔','🥤','🌙']
const COLOR_OPTIONS = ['#FEF3E8','#E8F0FE','#F0F4EE','#FDF6E8','#FEE8E8','#EDE8FE','#E8F5ED','#F5E8FE','#E8F4FE','#FFF3E0']

export default function Settings() {
  const [data, setData] = useState<AppData | null>(null)
  const [saved, setSaved] = useState(false)
  const [section, setSection] = useState<string | null>('profile')
  const [showNewCat, setShowNewCat] = useState(false)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [showNewRecurring, setShowNewRecurring] = useState(false)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('📦')
  const [catColor, setCatColor] = useState('#F5F5F5')
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalSaved, setGoalSaved] = useState('')
  const [goalIcon, setGoalIcon] = useState('🎯')
  const [rName, setRName] = useState('')
  const [rAmount, setRAmount] = useState('')
  const [rType, setRType] = useState<'income' | 'expense'>('expense')
  const [rCat, setRCat] = useState('')
  const [rDay, setRDay] = useState('1')

  useEffect(() => { const d = loadData(); setData(d); setRCat(d.categories[0]?.name || '') }, [])

  if (!data) return null

  const persist = (updated: AppData) => {
    saveData(updated)
    setData({ ...updated })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addCategory = () => {
    if (!catName.trim()) return
    const cat: Category = { id: crypto.randomUUID(), name: catName.trim(), icon: catIcon, color: catColor }
    persist({ ...data, categories: [...data.categories, cat] })
    setCatName(''); setCatIcon('📦'); setCatColor('#F5F5F5'); setShowNewCat(false)
  }
  const deleteCategory = (id: string) => persist({ ...data, categories: data.categories.filter(c => c.id !== id) })
  const updateBudget = (id: string, limit: string) => {
    persist({ ...data, categories: data.categories.map(c => c.id === id ? { ...c, budgetLimit: parseFloat(limit) || undefined } : c) })
  }

  const addGoal = () => {
    if (!goalName.trim() || !goalTarget) return
    const goal: Goal = { id: crypto.randomUUID(), name: goalName.trim(), icon: goalIcon, targetAmount: parseFloat(goalTarget), savedAmount: parseFloat(goalSaved) || 0 }
    persist({ ...data, goals: [...data.goals, goal] })
    setGoalName(''); setGoalTarget(''); setGoalSaved(''); setGoalIcon('🎯'); setShowNewGoal(false)
  }
  const deleteGoal = (id: string) => persist({ ...data, goals: data.goals.filter(g => g.id !== id) })
  const updateGoalSaved = (id: string, val: number) => persist({ ...data, goals: data.goals.map(g => g.id === id ? { ...g, savedAmount: val } : g) })

  const addRecurring = () => {
    if (!rName.trim() || !rAmount) return
    const r: RecurringTransaction = { id: crypto.randomUUID(), amount: parseFloat(rAmount), type: rType, category: rCat, description: rName.trim(), dayOfMonth: parseInt(rDay), active: true }
    persist({ ...data, recurring: [...(data.recurring || []), r] })
    setRName(''); setRAmount(''); setRType('expense'); setRDay('1'); setShowNewRecurring(false)
  }
  const toggleRecurring = (id: string) => persist({ ...data, recurring: data.recurring.map(r => r.id === id ? { ...r, active: !r.active } : r) })
  const deleteRecurring = (id: string) => persist({ ...data, recurring: data.recurring.filter(r => r.id !== id) })

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <button onClick={() => setSection(section === id ? null : id)} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px', background: 'none', border: 'none', textAlign: 'left',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
        {section === id ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {section === id && <div style={{ padding: '0 16px 16px' }}>{children}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 0', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Settings</h1>
          {saved && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}><Check size={14} /> Saved</span>}
        </div>

        {/* Profile */}
        <Section id="profile" title="👤 Profile">
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Your name</label>
            <input defaultValue={data.name} onBlur={e => persist({ ...data, name: e.target.value })}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Monthly income (TND)</label>
            <input type="number" defaultValue={data.monthlyIncome || ''} onBlur={e => persist({ ...data, monthlyIncome: parseFloat(e.target.value) || 0 })} placeholder="0.000"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, outline: 'none' }} />
          </div>
        </Section>

        {/* Recurring transactions */}
        <Section id="recurring" title="🔁 Recurring transactions">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
            These appear at the start of each month — you pick which ones happened.
          </p>
          {(data.recurring || []).map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 12px', background: 'var(--bg)', borderRadius: 12 }}>
              <button onClick={() => toggleRecurring(r.id)} style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: r.active ? 'var(--primary)' : 'var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {r.active && <Check size={12} color="white" />}
              </button>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{r.description}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }}>{r.category} · Day {r.dayOfMonth}</p>
              </div>
              <span className="amount-font" style={{ fontSize: 14, fontWeight: 600, color: r.type === 'income' ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }}>
                {r.type === 'income' ? '+' : '-'}{r.amount} TND
              </span>
              <button onClick={() => deleteRecurring(r.id)} style={{ background: 'none', border: 'none', padding: 4 }}><Trash2 size={15} color="var(--text-muted)" /></button>
            </div>
          ))}
          {showNewRecurring ? (
            <div style={{ background: 'rgba(61,90,92,0.05)', borderRadius: 12, padding: 12, marginTop: 8 }}>
              <div style={{ display: 'flex', background: 'var(--border)', borderRadius: 10, padding: 3, marginBottom: 10 }}>
                {(['expense', 'income'] as const).map(t => (
                  <button key={t} onClick={() => setRType(t)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: rType === t ? 'white' : 'transparent', fontSize: 13, color: rType === t ? (t === 'expense' ? 'var(--danger)' : 'var(--success)') : 'var(--text-muted)', fontWeight: rType === t ? 500 : 400 }}>
                    {t === 'expense' ? '− Expense' : '+ Income'}
                  </button>
                ))}
              </div>
              <input value={rName} onChange={e => setRName(e.target.value)} placeholder="Description (e.g. Rent, Salary)" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <input value={rAmount} onChange={e => setRAmount(e.target.value)} placeholder="Amount (TND)" type="number" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={rCat} onChange={e => setRCat(e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, outline: 'none' }}>
                  {data.categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
                <input value={rDay} onChange={e => setRDay(e.target.value)} placeholder="Day" type="number" min="1" max="31" style={{ width: 70, padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowNewRecurring(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 13 }}>Cancel</button>
                <button onClick={addRecurring} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 500 }}>Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewRecurring(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '0.5px dashed var(--border)', borderRadius: 12, padding: '10px 14px', width: '100%', justifyContent: 'center', fontSize: 13, color: 'var(--primary)', marginTop: 4 }}>
              <Plus size={15} /> Add recurring transaction
            </button>
          )}
        </Section>

        {/* Categories */}
        <Section id="categories" title="🏷️ Categories & budgets">
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>Set a monthly budget limit per category to get alerts.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.categories.map(cat => (
              <div key={cat.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{cat.icon}</div>
                  <span style={{ flex: 1, fontSize: 14 }}>{cat.name}</span>
                  <input
                    type="number" placeholder="Budget" defaultValue={cat.budgetLimit || ''}
                    onBlur={e => updateBudget(cat.id, e.target.value)}
                    style={{ width: 80, padding: '6px 8px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'white', fontSize: 12, outline: 'none', textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>TND</span>
                  <button onClick={() => deleteCategory(cat.id)} style={{ background: 'none', border: 'none', padding: 4 }}><Trash2 size={15} color="var(--text-muted)" /></button>
                </div>
              </div>
            ))}
          </div>
          {showNewCat ? (
            <div style={{ background: 'rgba(61,90,92,0.05)', borderRadius: 12, padding: 12, marginTop: 12 }}>
              <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Category name" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 10, outline: 'none' }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>Icon</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setCatIcon(e)} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${catIcon === e ? 'var(--primary)' : 'var(--border)'}`, background: catIcon === e ? 'rgba(61,90,92,0.1)' : 'white', fontSize: 18 }}>{e}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>Color</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {COLOR_OPTIONS.map(c => (
                  <button key={c} onClick={() => setCatColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `2px solid ${catColor === c ? 'var(--primary)' : 'transparent'}` }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowNewCat(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 13 }}>Cancel</button>
                <button onClick={addCategory} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 500 }}>Add</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewCat(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '0.5px dashed var(--border)', borderRadius: 12, padding: '10px 14px', width: '100%', justifyContent: 'center', fontSize: 13, color: 'var(--primary)', marginTop: 12 }}>
              <Plus size={15} /> Add category
            </button>
          )}
        </Section>

        {/* Goals */}
        <Section id="goals" title="🎯 Savings goals">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.goals.map(goal => (
              <div key={goal.id} style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{goal.icon} {goal.name}</span>
                  <button onClick={() => deleteGoal(goal.id)} style={{ background: 'none', border: 'none', padding: 4 }}><Trash2 size={14} color="var(--text-muted)" /></button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Saved so far</label>
                    <input type="number" value={goal.savedAmount} onChange={e => updateGoalSaved(goal.id, parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'white', fontSize: 13, outline: 'none', marginTop: 3 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>Target</label>
                    <input type="number" value={goal.targetAmount} readOnly
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--bg)', fontSize: 13, outline: 'none', marginTop: 3 }} />
                  </div>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 99, height: 5 }}>
                  <div style={{ background: 'var(--accent)', borderRadius: 99, height: 5, width: `${Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)}%` }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0', textAlign: 'right' }}>{Math.round((goal.savedAmount / goal.targetAmount) * 100)}% — needs {(goal.targetAmount - goal.savedAmount).toFixed(0)} TND more</p>
              </div>
            ))}
          </div>
          {showNewGoal ? (
            <div style={{ background: 'rgba(61,90,92,0.05)', borderRadius: 12, padding: 12, marginTop: 8 }}>
              <input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Goal name (e.g. Trip to Paris)" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <input value={goalIcon} onChange={e => setGoalIcon(e.target.value)} placeholder="Icon (emoji)" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <input value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Target amount (TND)" type="number" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <input value={goalSaved} onChange={e => setGoalSaved(e.target.value)} placeholder="Already saved (TND)" type="number" style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 12, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowNewGoal(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 13 }}>Cancel</button>
                <button onClick={addGoal} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 500 }}>Add goal</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewGoal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '0.5px dashed var(--border)', borderRadius: 12, padding: '10px 14px', width: '100%', justifyContent: 'center', fontSize: 13, color: 'var(--primary)', marginTop: 8 }}>
              <Plus size={15} /> Add goal
            </button>
          )}
        </Section>

        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>All data stored locally on your device 🔒</p>
        </div>
      </div>
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
