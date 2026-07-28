'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { loadData, saveData, canAfford } from '@/lib/storage'
import { AppData, Challenge, WishlistGroup, WishlistItem } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

interface AffordResult { affordable: boolean; after: number; tight: boolean }

export default function WishlistPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [addingItemTo, setAddingItemTo] = useState<string | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('')
  const [goalCreated, setGoalCreated] = useState<string | null>(null)
  const [affordResults, setAffordResults] = useState<Record<string, AffordResult | null>>({})
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

  const convertToGoal = (item: WishlistItem) => {
    if (!data || !item.price) return
    const goal: Challenge = { id: crypto.randomUUID(), name: item.name, icon: '🎯', targetAmount: item.price, savedAmount: 0, active: true }
    persist({ ...data, challenges: [...data.challenges, goal] })
    setGoalCreated(item.id)
    setTimeout(() => setGoalCreated(null), 2000)
  }

  const checkAfford = (item: WishlistItem) => {
    if (!data || !item.price) return
    if (affordResults[item.id] !== undefined) {
      setAffordResults(prev => { const n = { ...prev }; delete n[item.id]; return n })
      return
    }
    setAffordResults(prev => ({ ...prev, [item.id]: canAfford(data, item.price!) }))
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 3px', letterSpacing: '-0.7px' }}>Wishlist</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontWeight: 500 }}>🎯 goal · 💡 afford check</p>
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

        {showGroupForm && (
          <div className="card" style={{ padding: '14px', marginBottom: 14 }}>
            <input ref={itemInputRef} value={newGroupTitle} onChange={e => setNewGroupTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGroup()}
              placeholder="Group name (e.g. Tech, Travel, Home)" autoFocus
              className="field" style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowGroupForm(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={addGroup} className="btn-pink" style={{ flex: 2 }} disabled={!newGroupTitle.trim()}>Create group</button>
            </div>
          </div>
        )}

        {data.wishlistGroups.length === 0 && !showGroupForm && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--faint)' }}>
            <p style={{ fontSize: 32, margin: '0 0 10px' }}>✨</p>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.3px' }}>Nothing yet</p>
            <p style={{ fontSize: 13, margin: 0 }}>Create a group like "Tech" or "Travel"<br />then add items inside</p>
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
                <div onClick={() => toggleGroup(group.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '15px 16px', cursor: 'pointer' }}>
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

                    {pending.map(item => {
                      const afford = affordResults[item.id]
                      return (
                        <div key={item.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
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
                            {item.price && (
                              <button onClick={() => checkAfford(item)} title="Can I afford this?"
                                style={{
                                  background: afford !== undefined ? (afford === null ? 'var(--bg)' : afford.affordable ? (afford.tight ? '#FDF3E5' : 'var(--success-bg)') : 'var(--pink-light)') : 'var(--bg)',
                                  border: 'none', borderRadius: 7, padding: '4px 7px', cursor: 'pointer', flexShrink: 0,
                                  fontSize: 12, transition: 'all 0.15s',
                                }}>
                                💡
                              </button>
                            )}
                            {item.price && (
                              <button onClick={() => convertToGoal(item)} title="Convert to saving goal"
                                style={{
                                  background: goalCreated === item.id ? '#7EC8A0' : 'var(--pink-light)',
                                  border: 'none', borderRadius: 7, padding: '4px 7px', cursor: 'pointer', flexShrink: 0,
                                  fontSize: 11, fontWeight: 700,
                                  color: goalCreated === item.id ? 'white' : 'var(--pink)',
                                  transition: 'all 0.2s',
                                }}>
                                {goalCreated === item.id ? '✓' : '🎯'}
                              </button>
                            )}
                            <button onClick={() => deleteItem(group.id, item.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', flexShrink: 0 }}>
                              <Trash2 size={13} color="var(--faint)" />
                            </button>
                          </div>

                          {/* Afford result */}
                          {afford !== undefined && afford !== null && (
                            <div style={{
                              padding: '8px 16px 10px',
                              borderBottom: '0.5px solid var(--border)',
                              background: afford.affordable
                                ? (afford.tight ? 'var(--warning-bg)' : 'var(--success-bg)')
                                : 'var(--pink-faint)',
                            }}>
                              <p style={{
                                fontSize: 12, fontWeight: 600, margin: 0,
                                color: afford.affordable ? (afford.tight ? 'var(--warning)' : 'var(--success)') : 'var(--pink)',
                              }}>
                                {afford.affordable && !afford.tight && `✓ Yes — ${afford.after.toFixed(0)} TND still safe after`}
                                {afford.affordable && afford.tight && `⚠️ Yes, but you'll only have ${afford.after.toFixed(0)} TND safe left`}
                                {!afford.affordable && `✗ No — this dips ${Math.abs(afford.after).toFixed(0)} TND into your goals/bills`}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {bought.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '0.5px solid var(--border)', opacity: 0.45 }}>
                        <button onClick={() => toggleItem(group.id, item.id)} style={{
                          width: 22, height: 22, borderRadius: 6, border: 'none', background: '#7EC8A0', cursor: 'pointer', flexShrink: 0,
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
