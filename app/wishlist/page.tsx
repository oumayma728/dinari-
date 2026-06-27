'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData, WishlistGroup, WishlistItem } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

export default function WishlistPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const itemInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setData(loadData()) }, [])
  useEffect(() => {
    if (addingItemTo && itemInputRef.current) itemInputRef.current.focus()
  }, [addingItemTo])

  if (!data) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  const addGroup = () => {
    if (!newGroupTitle.trim()) return
    const group: WishlistGroup = { id: crypto.randomUUID(), title: newGroupTitle.trim(), items: [] }
    persist({ ...data, wishlistGroups: [...data.wishlistGroups, group] })
    setNewGroupTitle(''); setShowGroupForm(false)
    setExpandedGroups(s => new Set([...s, group.id]))
  }

  const deleteGroup = (gId: string) =>
    persist({ ...data, wishlistGroups: data.wishlistGroups.filter(g => g.id !== gId) })

  const addItem = (gId: string) => {
    if (!newItemName.trim()) return
    const item: WishlistItem = { id: crypto.randomUUID(), name: newItemName.trim(), price: parseFloat(newItemPrice) || undefined, bought: false }
    persist({ ...data, wishlistGroups: data.wishlistGroups.map(g => g.id === gId ? { ...g, items: [...g.items, item] } : g) })
    setNewItemName(''); setNewItemPrice(''); setAddingItemTo(null)
  }

  const toggleItem = (gId: string, iId: string) =>
    persist({ ...data, wishlistGroups: data.wishlistGroups.map(g => g.id === gId ? { ...g, items: g.items.map(i => i.id === iId ? { ...i, bought: !i.bought } : i) } : g) })

  const deleteItem = (gId: string, iId: string) =>
    persist({ ...data, wishlistGroups: data.wishlistGroups.map(g => g.id === gId ? { ...g, items: g.items.filter(i => i.id !== iId) } : g) })

  const toggleGroup = (id: string) =>
    setExpandedGroups(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 3px', letterSpacing: '-0.7px' }}>Wishlist</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontWeight: 500 }}>Tap item to tick when bought</p>
          </div>
          <button onClick={() => setShowGroupForm(s => !s)} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px',
            borderRadius: 100, border: 'none', cursor: 'pointer', marginTop: 3,
            background: 'var(--pink)', color: 'white', fontSize: 12, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(196,96,122,0.3)',
          }}>
            <Plus size={13} strokeWidth={2.5} /> Group
          </button>
        </div>

        {/* Add group form */}
        {showGroupForm && (
          <div className="card" style={{ padding: '14px', marginBottom: 14 }}>
            <input ref={itemInputRef} value={newGroupTitle} onChange={e => setNewGroupTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGroup()}
              placeholder="Group name (e.g. Body Care, Tech, Clothes)" autoFocus
              className="field" style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowGroupForm(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={addGroup} className="btn-pink" style={{ flex: 2 }} disabled={!newGroupTitle.trim()}>Create group</button>
            </div>
          </div>
        )}

        {/* Groups */}
        {data.wishlistGroups.length === 0 && !showGroupForm && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <p style={{ fontSize: 32, margin: '0 0 10px' }}>✨</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>Nothing yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Create a group like "Body Care" or "Tech"<br />then add items inside</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.wishlistGroups.map(group => {
            const isOpen = expandedGroups.has(group.id)
            const pending = group.items.filter(i => !i.bought)
            const bought = group.items.filter(i => i.bought)
            const isAddingHere = addingItemTo === group.id

            return (
              <div key={group.id} className="card" style={{ overflow: 'hidden' }}>
                {/* Group header */}
                <div
                  onClick={() => toggleGroup(group.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer' }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>{group.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--faint)', margin: '2px 0 0', fontWeight: 500 }}>
                      {pending.length} item{pending.length !== 1 ? 's' : ''}{bought.length > 0 ? ` · ${bought.length} bought` : ''}
                    </p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteGroup(group.id) }} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                    <Trash2 size={15} color="var(--faint)" />
                  </button>
                  {isOpen ? <ChevronUp size={17} color="var(--faint)" /> : <ChevronDown size={17} color="var(--faint)" />}
                </div>

                {isOpen && (
                  <div style={{ borderTop: '0.5px solid var(--border)' }}>

                    {/* Pending items */}
                    {pending.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
                        {/* Checkbox */}
                        <button onClick={() => toggleItem(group.id, item.id)} style={{
                          width: 22, height: 22, borderRadius: 6, border: '1.5px solid var(--border)', background: 'none', cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }} />
                        <p style={{ flex: 1, fontSize: 14, fontWeight: 500, margin: 0 }}>{item.name}</p>
                        {item.price && (
                          <p className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)', margin: 0, flexShrink: 0 }}>
                            {item.price.toFixed(0)} TND
                          </p>
                        )}
                        <button onClick={() => deleteItem(group.id, item.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                          <Trash2 size={13} color="var(--faint)" />
                        </button>
                      </div>
                    ))}

                    {/* Bought items */}
                    {bought.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid var(--border)', opacity: 0.45 }}>
                        <button onClick={() => toggleItem(group.id, item.id)} style={{
                          width: 22, height: 22, borderRadius: 6, border: 'none', background: 'var(--success)', cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <p style={{ flex: 1, fontSize: 14, fontWeight: 400, margin: 0, textDecoration: 'line-through', color: 'var(--muted)' }}>{item.name}</p>
                        {item.price && <p className="num" style={{ fontSize: 13, color: 'var(--faint)', margin: 0, flexShrink: 0 }}>{item.price.toFixed(0)} TND</p>}
                        <button onClick={() => deleteItem(group.id, item.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                          <Trash2 size={13} color="var(--faint)" />
                        </button>
                      </div>
                    ))}

                    {/* Add item inline */}
                    {isAddingHere ? (
                      <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input
                          ref={itemInputRef}
                          value={newItemName} onChange={e => setNewItemName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addItem(group.id)}
                          placeholder="Item name"
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 10, padding: '10px 13px', fontSize: 14 }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 10, padding: '0 12px' }}>
                            <input type="number" inputMode="decimal" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                              placeholder="Price (optional)"
                              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, padding: '10px 0' }} />
                            <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 600 }}>TND</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button onClick={() => { setAddingItemTo(null); setNewItemName(''); setNewItemPrice('') }} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                          <button onClick={() => addItem(group.id)} className="btn-pink" style={{ flex: 2 }} disabled={!newItemName.trim()}>Add</button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingItemTo(group.id); setNewItemName(''); setNewItemPrice('') }}
                        style={{ width: '100%', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--pink)', fontSize: 13, fontWeight: 600 }}
                      >
                        <Plus size={15} strokeWidth={2.5} /> Add item
                      </button>
                    )}
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
