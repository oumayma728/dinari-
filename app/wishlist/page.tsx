'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Loader2, Sparkles } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, WishlistItem } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const PRIORITY_COLOR = { low: 'var(--success)', medium: 'var(--accent)', high: 'var(--danger)' }
const PRIORITY_BG = { low: 'var(--success-bg)', medium: '#FDF6EC', high: 'var(--danger-bg)' }
const PRIORITY_LABEL = { low: 'Someday', medium: 'Soon', high: 'Want it!' }

export default function Wishlist() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState('')
  const [planning, setPlanningId] = useState<string | null>(null)
  const [plans, setPlans] = useState<Record<string, string>>({})

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (updated: AppData) => { saveData(updated); setData({ ...updated }) }

  const addItem = () => {
    if (!name.trim() || !price) return
    const item: WishlistItem = {
      id: crypto.randomUUID(), name: name.trim(),
      estimatedPrice: parseFloat(price), priority, notes: notes.trim(),
      bought: false, createdAt: new Date().toISOString(),
    }
    persist({ ...data, wishlist: [item, ...data.wishlist] })
    setName(''); setPrice(''); setNotes(''); setPriority('medium'); setShowAdd(false)
  }

  const toggleBought = (id: string) =>
    persist({ ...data, wishlist: data.wishlist.map(w => w.id === id ? { ...w, bought: !w.bought } : w) })

  const deleteItem = (id: string) =>
    persist({ ...data, wishlist: data.wishlist.filter(w => w.id !== id) })

  const getPlan = async (item: WishlistItem) => {
    setPlanningId(item.id)
    setPlans(p => ({ ...p, [item.id]: '' }))
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: `How can I save for "${item.name}" which costs ${item.estimatedPrice} TND? Short practical plan please.` }],
        context: { name: data.name, monthlyIncome: data.monthlyIncome, wishlistItem: item },
      }),
    })
    const reader = res.body?.getReader(); const decoder = new TextDecoder(); let full = ''
    while (reader) {
      const { done, value } = await reader.read(); if (done) break
      full += decoder.decode(value); setPlans(p => ({ ...p, [item.id]: full }))
    }
    setPlanningId(null)
  }

  const active = data.wishlist.filter(w => !w.bought)
  const bought = data.wishlist.filter(w => w.bought)

  const Input = ({ value, onChange, placeholder, type = 'text' }: any) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type}
      style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: 'white', fontSize: 15, color: 'var(--text)', outline: 'none', boxShadow: 'var(--shadow-sm)', marginBottom: 10 }} />
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.6px' }}>Wishlist</h1>
          <button onClick={() => setShowAdd(true)} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'var(--primary)', color: 'white', border: 'none',
            borderRadius: 100, padding: '9px 16px', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(26,46,47,0.25)',
          }}>
            <Plus size={15} strokeWidth={2.5} /> Add
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="card" style={{ padding: '18px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', letterSpacing: '-0.3px' }}>New wish ✨</p>
            <Input value={name} onChange={setName} placeholder="What do you want?" />
            <Input value={price} onChange={setPrice} placeholder="Estimated price (TND)" type="number" />
            <Input value={notes} onChange={setNotes} placeholder="Notes (optional)" />
            <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: '8px', borderRadius: 10, border: 'none',
                  background: priority === p ? PRIORITY_BG[p] : 'white',
                  color: priority === p ? PRIORITY_COLOR[p] : 'var(--text-muted)',
                  fontSize: 12, fontWeight: priority === p ? 700 : 400,
                  boxShadow: 'var(--shadow-sm)',
                }}>{PRIORITY_LABEL[p]}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', background: 'rgba(26,22,20,0.06)', fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Cancel</button>
              <button onClick={addItem} style={{ flex: 2, padding: '13px', borderRadius: 13, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 12px rgba(26,46,47,0.25)' }}>Add to wishlist</button>
            </div>
          </div>
        )}

        {active.length === 0 && !showAdd && (
          <div className="card" style={{ padding: 36, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 36, margin: '0 0 10px' }}>✨</p>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.2px' }}>Your wishlist is empty</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Add things you want and I'll help you plan for them</p>
          </div>
        )}

        {/* Active items */}
        {active.length > 0 && (
          <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
            {active.map((item, i) => (
              <div key={item.id}>
                <div style={{ padding: '16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  {/* Top row: name + buttons */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>{item.name}</p>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
                          background: PRIORITY_BG[item.priority], color: PRIORITY_COLOR[item.priority],
                          letterSpacing: '0.2px',
                        }}>{PRIORITY_LABEL[item.priority]}</span>
                      </div>
                      <p className="num" style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', margin: 0, letterSpacing: '-0.6px' }}>
                        {item.estimatedPrice} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>TND</span>
                      </p>
                      {item.notes && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>{item.notes}</p>}
                    </div>

                    {/* Action buttons — always visible */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleBought(item.id)}
                        title="Mark as bought"
                        style={{
                          width: 36, height: 36, borderRadius: '50%', border: 'none',
                          background: 'var(--success-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}>
                        <Check size={16} color="var(--success)" strokeWidth={2.5} />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        title="Remove"
                        style={{
                          width: 36, height: 36, borderRadius: '50%', border: 'none',
                          background: 'var(--danger-bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}>
                        <Trash2 size={15} color="var(--danger)" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* AI plan button */}
                  <button onClick={() => getPlan(item)} disabled={planning === item.id} style={{
                    width: '100%', padding: '10px', borderRadius: 11, border: 'none',
                    background: 'rgba(26,46,47,0.05)', color: 'var(--primary)',
                    fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: planning === item.id ? 'not-allowed' : 'pointer',
                  }}>
                    {planning === item.id
                      ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Planning…</>
                      : <><Sparkles size={13} /> Help me save for this</>}
                  </button>

                  {plans[item.id] && (
                    <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 11, background: 'rgba(26,46,47,0.04)', fontSize: 13, lineHeight: 1.65, color: 'var(--text)' }}>
                      {plans[item.id]}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bought */}
        {bought.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', margin: '20px 0 10px', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Got it ✅</p>
            <div className="card" style={{ overflow: 'hidden' }}>
              {bought.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none', opacity: 0.55 }}>
                  <p style={{ flex: 1, fontSize: 14, fontWeight: 500, margin: 0, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.name}</p>
                  <span className="num" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.estimatedPrice} TND</span>
                  <button onClick={() => toggleBought(item.id)} title="Unmark" style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                    <Check size={15} color="var(--success)" />
                  </button>
                  <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                    <Trash2 size={14} color="var(--text-faint)" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="safe-bottom" />
      <BottomNav />
    </div>
  )
}
