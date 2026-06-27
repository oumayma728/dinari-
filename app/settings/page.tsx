'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Target, Check } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, Category, Goal } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const EMOJI_OPTIONS = ['🥗','🚌','🛒','🛍','💊','🎬','💡','💰','📦','☕','🍕','💇','🎓','💻','🏠','✈️','🎁','🐾','📱','⚽']
const COLOR_OPTIONS = ['#FEF3E8','#E8F0FE','#F0F4EE','#FDF6E8','#FEE8E8','#EDE8FE','#E8F5ED','#F5E8FE','#E8F4FE','#FFF3E0']

export default function Settings() {
  const [data, setData] = useState<AppData | null>(null)
  const [saved, setSaved] = useState(false)
  const [showNewCat, setShowNewCat] = useState(false)
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [catName, setCatName] = useState('')
  const [catIcon, setCatIcon] = useState('📦')
  const [catColor, setCatColor] = useState('#F5F5F5')
  const [goalName, setGoalName] = useState('')
  const [goalTarget, setGoalTarget] = useState('')
  const [goalSaved, setGoalSaved] = useState('')
  const [goalIcon, setGoalIcon] = useState('🎯')

  useEffect(() => { setData(loadData()) }, [])

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

  const deleteCategory = (id: string) => {
    persist({ ...data, categories: data.categories.filter(c => c.id !== id) })
  }

  const addGoal = () => {
    if (!goalName.trim() || !goalTarget) return
    const goal: Goal = {
      id: crypto.randomUUID(), name: goalName.trim(), icon: goalIcon,
      targetAmount: parseFloat(goalTarget), savedAmount: parseFloat(goalSaved) || 0,
    }
    persist({ ...data, goals: [...data.goals, goal] })
    setGoalName(''); setGoalTarget(''); setGoalSaved(''); setGoalIcon('🎯'); setShowNewGoal(false)
  }

  const updateGoalSaved = (id: string, val: number) => {
    persist({ ...data, goals: data.goals.map(g => g.id === id ? { ...g, savedAmount: val } : g) })
  }

  const deleteGoal = (id: string) => {
    persist({ ...data, goals: data.goals.filter(g => g.id !== id) })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 0', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Settings</h1>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--success)', fontWeight: 500 }}>
              <Check size={14} /> Saved
            </span>
          )}
        </div>

        {/* Profile */}
        <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Profile</p>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Your name</label>
            <input value={data.name} onChange={e => persist({ ...data, name: e.target.value })}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Monthly income (TND)</label>
            <input type="number" value={data.monthlyIncome || ''} onChange={e => persist({ ...data, monthlyIncome: parseFloat(e.target.value) || 0 })}
              placeholder="0.000"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, outline: 'none' }} />
          </div>
        </div>

        {/* Categories */}
        <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Categories</p>
            <button onClick={() => setShowNewCat(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Add
            </button>
          </div>

          {showNewCat && (
            <div style={{ background: 'rgba(61,90,92,0.05)', borderRadius: 12, padding: '12px', marginBottom: 12 }}>
              <input value={catName} onChange={e => setCatName(e.target.value)} placeholder="Category name"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 10, outline: 'none' }} />
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 6px' }}>Icon</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setCatIcon(e)} style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${catIcon === e ? 'var(--primary)' : 'var(--border)'}`, background: catIcon === e ? 'rgba(61,90,92,0.1)' : 'white', fontSize: 18, cursor: 'pointer' }}>{e}</button>
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
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{cat.icon}</div>
                <span style={{ flex: 1, fontSize: 14 }}>{cat.name}</span>
                <button onClick={() => deleteCategory(cat.id)} style={{ background: 'none', border: 'none', padding: 4 }}>
                  <Trash2 size={15} color="var(--text-muted)" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>Savings goals</p>
            <button onClick={() => setShowNewGoal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Add
            </button>
          </div>

          {showNewGoal && (
            <div style={{ background: 'rgba(61,90,92,0.05)', borderRadius: 12, padding: '12px', marginBottom: 12 }}>
              <input value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Goal name (e.g. Trip to Paris)"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <input value={goalIcon} onChange={e => setGoalIcon(e.target.value)} placeholder="Icon emoji"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <input value={goalTarget} onChange={e => setGoalTarget(e.target.value)} placeholder="Target amount (TND)" type="number"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 8, outline: 'none' }} />
              <input value={goalSaved} onChange={e => setGoalSaved(e.target.value)} placeholder="Already saved (TND)" type="number"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 12, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowNewGoal(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '0.5px solid var(--border)', background: 'white', fontSize: 13 }}>Cancel</button>
                <button onClick={addGoal} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 500 }}>Add goal</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.goals.map(goal => (
              <div key={goal.id} style={{ background: 'var(--bg)', borderRadius: 12, padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{goal.icon} {goal.name}</span>
                  <button onClick={() => deleteGoal(goal.id)} style={{ background: 'none', border: 'none', padding: 4 }}>
                    <Trash2 size={14} color="var(--text-muted)" />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input type="number" value={goal.savedAmount} onChange={e => updateGoalSaved(goal.id, parseFloat(e.target.value) || 0)}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'white', fontSize: 13, outline: 'none' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>/ {goal.targetAmount} TND</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: 99, height: 5 }}>
                  <div style={{ background: 'var(--accent)', borderRadius: 99, height: 5, width: `${Math.min(100, (goal.savedAmount / goal.targetAmount) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>All data is stored locally on your device 🔒</p>
        </div>
      </div>
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
