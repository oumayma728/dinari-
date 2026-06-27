'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Loader2 } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, WishlistItem } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const PRIORITY_COLOR = { low: '#6B8F71', medium: '#D4A373', high: '#C4736A' }
const PRIORITY_LABEL = { low: 'Someday', medium: 'Soon', high: 'Want it!' }

export default function Wishlist() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [planning, setPlanningId] = useState<string | null>(null)
  const [plan, setPlan] = useState('')

  useEffect(() => { setData(loadData()) }, [])

  if (!data) return null

  const refresh = () => setData(loadData())

  const addItem = () => {
    if (!name.trim() || !price) return
    const item: WishlistItem = {
      id: crypto.randomUUID(), name: name.trim(),
      estimatedPrice: parseFloat(price), priority, notes: notes.trim(),
      bought: false, createdAt: new Date().toISOString(),
    }
    data.wishlist = [item, ...data.wishlist]
    saveData(data)
    refresh()
    setShowAdd(false)
    setName(''); setPrice(''); setNotes(''); setPriority('medium')
  }

  const toggleBought = (id: string) => {
    data.wishlist = data.wishlist.map(w => w.id === id ? { ...w, bought: !w.bought } : w)
    saveData(data)
    refresh()
  }

  const deleteItem = (id: string) => {
    data.wishlist = data.wishlist.filter(w => w.id !== id)
    saveData(data)
    refresh()
  }

  const getPlan = async (item: WishlistItem) => {
    setPlanningId(item.id)
    setPlan('')
    const { income, expenses } = { income: data.monthlyIncome, expenses: 0 }
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `How can I save for "${item.name}" which costs ${item.estimatedPrice} TND? Give me a short, practical plan.` }],
        context: { name: data.name, monthlyIncome: data.monthlyIncome, wishlistItem: item },
      }),
    })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let full = ''
    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value)
      setPlan(full)
    }
    setPlanningId(null)
  }

  const active = data.wishlist.filter(w => !w.bought)
  const bought = data.wishlist.filter(w => w.bought)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 0', paddingTop: 'calc(16px + env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Wishlist 🤍</h1>
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 500,
          }}>
            <Plus size={16} /> Add
          </button>
        </div>

        {active.length === 0 && !showAdd && (
          <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>✨</p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
              Add things you want to buy<br />and I'll help you plan for them!
            </p>
          </div>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 14px' }}>New wish ✨</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="What do you want?"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 10, outline: 'none' }} />
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Estimated price (TND)" type="number"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 10, outline: 'none' }} />
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14, marginBottom: 12, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: '8px', borderRadius: 10,
                  border: `1.5px solid ${priority === p ? PRIORITY_COLOR[p] : 'var(--border)'}`,
                  background: priority === p ? `${PRIORITY_COLOR[p]}15` : 'white',
                  color: priority === p ? PRIORITY_COLOR[p] : 'var(--text-muted)',
                  fontSize: 12, fontWeight: priority === p ? 500 : 400,
                }}>
                  {PRIORITY_LABEL[p]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '0.5px solid var(--border)', background: 'white', fontSize: 14 }}>Cancel</button>
              <button onClick={addItem} style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 500 }}>Add to wishlist</button>
            </div>
          </div>
        )}

        {/* Active items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {active.map(item => (
            <div key={item.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{item.name}</p>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: `${PRIORITY_COLOR[item.priority]}18`, color: PRIORITY_COLOR[item.priority] }}>
                      {PRIORITY_LABEL[item.priority]}
                    </span>
                  </div>
                  <p className="amount-font" style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)', margin: '4px 0 0' }}>
                    {item.estimatedPrice} TND
                  </p>
                  {item.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{item.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 10 }}>
                  <button onClick={() => toggleBought(item.id)} style={{ width: 32, height: 32, borderRadius: '50%', border: '0.5px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} color="var(--success)" />
                  </button>
                  <button onClick={() => deleteItem(item.id)} style={{ width: 32, height: 32, borderRadius: '50%', border: '0.5px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} color="var(--text-muted)" />
                  </button>
                </div>
              </div>
              <button onClick={() => getPlan(item)} disabled={planning === item.id} style={{
                width: '100%', padding: '9px', borderRadius: 10, border: '0.5px solid var(--primary)',
                background: 'rgba(61,90,92,0.06)', color: 'var(--primary)',
                fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {planning === item.id ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Planning...</> : '✨ Help me save for this'}
              </button>
              {plan && planning === null && (
                <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(61,90,92,0.06)', fontSize: 13, lineHeight: 1.6, color: 'var(--text)' }}>
                  {plan}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bought items */}
        {bought.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '20px 0 10px', fontWeight: 500 }}>✅ Got it!</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bought.map(item => (
                <div key={item.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.6 }}>
                  <p style={{ flex: 1, fontSize: 14, margin: 0, textDecoration: 'line-through' }}>{item.name}</p>
                  <span className="amount-font" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.estimatedPrice} TND</span>
                  <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', padding: 4 }}>
                    <Trash2 size={14} color="var(--text-muted)" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
