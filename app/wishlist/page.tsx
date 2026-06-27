'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Check } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, WishlistItem } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const PRI_LABEL = { low: 'Someday', medium: 'Soon', high: 'Want it!' }
const PRI_COLOR = { low: '#4A8C5C', medium: '#B07030', high: '#C4607A' }
const PRI_BG = { low: '#EDF5F0', medium: '#FDF4E7', high: '#F9EEF1' }

export default function WishlistPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [bought, setBought] = useState<Set<string>>(new Set())

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (d: AppData) => { saveData(d); setData({ ...d }) }

  const add = () => {
    if (!name.trim() || !price) return
    const item: WishlistItem = { id: crypto.randomUUID(), name: name.trim(), estimatedPrice: parseFloat(price), priority }
    persist({ ...data, wishlist: [item, ...data.wishlist] })
    setName(''); setPrice(''); setPriority('medium'); setShowAdd(false)
  }

  const remove = (id: string) => persist({ ...data, wishlist: data.wishlist.filter(w => w.id !== id) })
  const toggleBought = (id: string) => setBought(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const active = data.wishlist.filter(w => !bought.has(w.id))
  const done = data.wishlist.filter(w => bought.has(w.id))

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.8px' }}>Wishlist</h1>
          <button onClick={() => setShowAdd(true)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--pink)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(196,96,122,0.3)' }}>
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 28px' }}>
          The AI uses this to build your savings timeline.
        </p>

        {showAdd && (
          <div style={{ background: 'white', borderRadius: 18, padding: '18px', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>New item</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="What do you want?"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: 'none', background: 'var(--pink-faint)', fontSize: 15, outline: 'none', marginBottom: 10 }} />
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--pink-faint)', borderRadius: 12, padding: '0 14px', marginBottom: 12 }}>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Estimated price"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 15, padding: '12px 0' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>TND</span>
            </div>
            <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
              {(['low', 'medium', 'high'] as const).map(p => (
                <button key={p} onClick={() => setPriority(p)} style={{
                  flex: 1, padding: '9px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: priority === p ? PRI_BG[p] : 'var(--pink-faint)',
                  color: priority === p ? PRI_COLOR[p] : 'var(--text-faint)',
                  fontSize: 12, fontWeight: priority === p ? 700 : 500,
                }}>{PRI_LABEL[p]}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={add} className="btn-primary" style={{ flex: 2, background: 'var(--pink)' }}>Add</button>
            </div>
          </div>
        )}

        {active.length === 0 && !showAdd && (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 32, margin: '0 0 12px' }}>✨</p>
            <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 6px', color: 'var(--text)' }}>Nothing on your list</p>
            <p style={{ fontSize: 13, margin: 0 }}>Add things you want — the AI will tell you when you can afford them.</p>
          </div>
        )}

        {active.length > 0 && (
          <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
            {active.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                <button onClick={() => toggleBought(item.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                  <Check size={14} color="var(--success)" />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0, letterSpacing: '-0.2px' }}>{item.name}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: PRI_BG[item.priority], color: PRI_COLOR[item.priority], display: 'inline-block', marginTop: 3 }}>
                    {PRI_LABEL[item.priority]}
                  </span>
                </div>
                <p className="num" style={{ fontSize: 15, fontWeight: 700, margin: 0, flexShrink: 0, color: 'var(--pink)' }}>{item.estimatedPrice.toFixed(0)}</p>
                <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                  <Trash2 size={14} color="var(--text-faint)" />
                </button>
              </div>
            ))}
          </div>
        )}

        {done.length > 0 && (
          <>
            <p className="label" style={{ margin: '0 0 10px' }}>Got it ✓</p>
            <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', opacity: 0.5 }}>
              {done.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  <button onClick={() => toggleBought(item.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}>
                    <Check size={14} color="var(--success)" strokeWidth={2.5} />
                  </button>
                  <p style={{ flex: 1, fontSize: 14, margin: 0, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{item.name}</p>
                  <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                    <Trash2 size={14} color="var(--text-faint)" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="safe-b" />
      <BottomNav />
    </div>
  )
}
