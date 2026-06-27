'use client'
import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { loadData, saveData, calcTotals } from '@/lib/storage'
import { AppData, WishlistItem, Priority } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const PRI_OPTS: Priority[] = ['high', 'medium', 'low']
const PRI_LABEL: Record<Priority, string> = { high: 'High', medium: 'Med', low: 'Low' }
const PRI_BG: Record<Priority, string> = { high: '#EDF5F0', medium: '#FDF3E5', high2: '', medium2: '', low: 'var(--pink-faint)' } as any
const PRI_COLOR: Record<Priority, string> = { high: 'var(--success)', medium: 'var(--warning)', low: 'var(--faint)' }

export default function WishlistPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })
  const t = calcTotals(data)

  const add = () => {
    if (!name.trim() || !price) return
    const item: WishlistItem = { id: crypto.randomUUID(), name: name.trim(), price: parseFloat(price), priority }
    persist({ ...data, wishlist: [item, ...data.wishlist], insights: null })
    setName(''); setPrice(''); setPriority('medium'); setShowAdd(false)
  }

  const remove = (id: string) => persist({ ...data, wishlist: data.wishlist.filter(w => w.id !== id), insights: null })

  const monthsToAfford = (price: number) =>
    t.savingsCapacity > 0 ? Math.ceil(price / t.savingsCapacity) : null

  const sorted = [...data.wishlist].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.8px' }}>Wishlist</h1>
          <button
            onClick={() => setShowAdd(s => !s)}
            style={{ width: 30, height: 30, borderRadius: '50%', background: showAdd ? 'var(--pink-light)' : 'var(--pink)', border: 'none', color: showAdd ? 'var(--pink)' : 'white', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: 4 }}
          >
            {showAdd ? '×' : '+'}
          </button>
        </div>

        {t.savingsCapacity > 0 ? (
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 24px', fontWeight: 500 }}>
            Saving <span className="num" style={{ fontWeight: 700, color: 'var(--success)' }}>{t.savingsCapacity.toFixed(0)} TND</span>/month at current pace
          </p>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--pink)', margin: '0 0 24px', fontWeight: 500 }}>
            No savings capacity this month — add income/adjust expenses
          </p>
        )}

        {/* Add form */}
        {showAdd && (
          <div className="card" style={{ padding: '16px', marginBottom: 20 }}>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="What do you want?"
              autoFocus
              style={{ width: '100%', border: 'none', outline: 'none', background: 'var(--pink-faint)', borderRadius: 10, padding: '11px 13px', fontSize: 15, marginBottom: 10 }} />
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--pink-faint)', borderRadius: 10, padding: '0 13px', marginBottom: 10 }}>
              <input type="number" inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 15, fontWeight: 600, padding: '11px 0' }} />
              <span style={{ fontSize: 12, color: 'var(--faint)', fontWeight: 600 }}>TND</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {PRI_OPTS.map(p => (
                <button key={p} onClick={() => setPriority(p)}
                  style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: priority === p ? 'var(--pink)' : 'var(--pink-faint)', color: priority === p ? 'white' : 'var(--faint)' }}>
                  {PRI_LABEL[p]}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAdd(false)} className="btn" style={{ flex: 1, background: 'var(--pink-faint)', color: 'var(--muted)' }}>Cancel</button>
              <button onClick={add} className="btn" style={{ flex: 2, background: name.trim() && price ? 'var(--pink)' : 'var(--pink-faint)', color: name.trim() && price ? 'white' : 'var(--faint)' }}>Add</button>
            </div>
          </div>
        )}

        {/* Items */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <p style={{ fontSize: 28, margin: '0 0 10px' }}>✨</p>
            <p style={{ fontSize: 14, margin: 0, fontWeight: 500 }}>Nothing yet — add what you want to save for</p>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            {sorted.map((item, i) => {
              const months = monthsToAfford(item.price)
              const insight = data.insights?.wishlist?.[item.id]
              return (
                <div key={item.id} style={{ padding: '14px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Priority dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRI_COLOR[item.priority], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.2px' }}>
                        {item.name}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p className="num" style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--pink)' }}>{item.price.toFixed(0)} TND</p>
                      {months !== null && (
                        <p style={{ fontSize: 10, color: months <= 1 ? 'var(--success)' : months <= 3 ? 'var(--warning)' : 'var(--faint)', margin: '2px 0 0', fontWeight: 700 }}>
                          {months <= 1 ? 'This month!' : `~${months}mo`}
                        </p>
                      )}
                    </div>
                    <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', padding: '0 0 0 6px', cursor: 'pointer', flexShrink: 0 }}>
                      <Trash2 size={14} color="var(--faint)" />
                    </button>
                  </div>

                  {/* Affordability bar */}
                  {t.savingsCapacity > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ background: 'var(--pink-faint)', borderRadius: 99, height: 3 }}>
                        <div style={{
                          background: (months ?? 99) <= 1 ? 'var(--success)' : 'var(--pink)',
                          borderRadius: 99, height: 3,
                          width: `${Math.min(100, (t.savingsCapacity / item.price) * 100)}%`,
                          transition: 'width 0.4s',
                        }} />
                      </div>
                    </div>
                  )}

                  {/* AI insight */}
                  {insight && <p className="insight">{insight}</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
