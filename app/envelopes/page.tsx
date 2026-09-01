'use client'
import { useState, useEffect, useMemo } from 'react'
import { loadData, saveData, calcStats, checkMonthlyReset } from '@/lib/storage'
import { AppData, Challenge } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import EnvelopeCard from '@/components/EnvelopeCard'

export default function EnvelopesPage() {
  const [data, setData] = useState<AppData | null>(null)

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [cName, setCName] = useState('')
  const [cIcon, setCIcon] = useState('')
  const [cTarget, setCTarget] = useState('')
  const [cDeadline, setCDeadline] = useState('')
  const [cMonthly, setCMonthly] = useState('')

  // Stuff panel
  const [showStuff, setShowStuff] = useState(false)
  const [stuffAmounts, setStuffAmounts] = useState<Record<string, string>>({})

  useEffect(() => {
    let d = loadData()
    d = checkMonthlyReset(d)
    saveData(d)
    setData(d)
  }, [])

  const stats = useMemo(() => data ? calcStats(data) : null, [data])

  if (!data || !stats) return null

  const persist = (d: AppData) => setData({ ...saveData(d) })

  const addChallenge = () => {
    if (!cName.trim() || !cTarget) return
    const c: Challenge = {
      id: crypto.randomUUID(),
      name: cName.trim(),
      icon: cIcon.trim() || '🎯',
      targetAmount: parseFloat(cTarget),
      savedAmount: 0,
      active: true,
      deadline: cDeadline || undefined,
      monthlyContribution: parseFloat(cMonthly) || undefined,
    }
    persist({ ...data, challenges: [...data.challenges, c] })
    setCName(''); setCIcon(''); setCTarget(''); setCDeadline(''); setCMonthly(''); setShowForm(false)
  }

  const monthsLeft = (deadline: string) => {
    const [y, m] = deadline.split('-').map(Number)
    const now = new Date()
    return (y - now.getFullYear()) * 12 + (m - (now.getMonth() + 1))
  }

  const setMonthAmount = (id: string, month: string, amount: number) =>
    persist({
      ...data,
      challenges: data.challenges.map(c => {
        if (c.id !== id) return c
        const noHistory = !c.monthlyHistory || Object.keys(c.monthlyHistory).length === 0
        const base = noHistory ? c.savedAmount : (c.baseAmount || 0)
        const history = { ...(c.monthlyHistory || {}), [month]: amount }
        const historySum = Object.values(history).reduce((s, v) => s + v, 0)
        const savedAmount = Math.min(c.targetAmount, base + historySum)
        return { ...c, monthlyHistory: history, savedAmount, baseAmount: base }
      }),
    })

  const toggleEssential = (id: string) =>
    persist({ ...data, challenges: data.challenges.map(c => c.id === id ? { ...c, isEssential: !c.isEssential } : c) })

  const deleteChallenge = (id: string) =>
    persist({ ...data, challenges: data.challenges.filter(c => c.id !== id) })

  const confirmStuff = () => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const updated = data.challenges.map(c => {
      if (!c.active) return c
      const add = parseFloat(stuffAmounts[c.id] || '0') || 0
      if (add <= 0) return c
      const noHistory = !c.monthlyHistory || Object.keys(c.monthlyHistory).length === 0
      const base = noHistory ? c.savedAmount : (c.baseAmount || 0)
      const history = { ...(c.monthlyHistory || {}), [currentMonth]: (c.monthlyHistory?.[currentMonth] || 0) + add }
      const historySum = Object.values(history).reduce((s, v) => s + v, 0)
      const savedAmount = Math.min(c.targetAmount, base + historySum)
      return { ...c, monthlyHistory: history, savedAmount, baseAmount: base }
    })
    persist({ ...data, challenges: updated })
    setShowStuff(false); setStuffAmounts({})
  }

  const totalSaved = data.challenges.reduce((s, c) => s + c.savedAmount, 0)
  const totalTarget = data.challenges.reduce((s, c) => s + c.targetAmount, 0)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 3px', letterSpacing: '-0.7px' }}>Envelopes</h1>
            {data.challenges.length > 0 && (
              <p className="num" style={{ fontSize: 13, color: 'var(--muted)', margin: 0, fontWeight: 500 }}>
                {totalSaved.toFixed(0)} / {totalTarget.toFixed(0)} TND saved
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {data.challenges.length > 0 && stats.actualRemaining > 0 && (
              <button
                onClick={() => { setShowStuff(s => !s); setStuffAmounts({}) }}
                style={{
                  padding: '8px 14px', borderRadius: 20,
                  border: '1.5px solid var(--border)', background: 'none',
                  color: 'var(--muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
              >
                💰 Stuff all
              </button>
            )}
            <button
              onClick={() => setShowForm(s => !s)}
              style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: showForm ? 'var(--pink-light)' : 'var(--pink)',
                color: showForm ? 'var(--pink)' : 'white',
                fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {showForm ? '×' : '+'}
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="card" style={{ padding: '14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={cIcon} onChange={e => setCIcon(e.target.value)} placeholder="🎯"
                style={{ width: 44, border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 10, padding: '10px 0', fontSize: 20, textAlign: 'center' }} />
              <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Goal name (e.g. Laptop)"
                className="field" style={{ flex: 1, marginBottom: 0 }} autoFocus />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '0 14px' }}>
                <input type="number" inputMode="decimal" value={cTarget} onChange={e => setCTarget(e.target.value)} placeholder="Target"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 15, fontWeight: 600, padding: '11px 0' }} />
                <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 700 }}>TND</span>
              </div>
              <input type="month" value={cDeadline} onChange={e => setCDeadline(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'var(--bg)', borderRadius: 12, padding: '11px 12px', fontSize: 13, color: cDeadline ? 'var(--text)' : 'var(--faint)', fontWeight: 500 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 12, padding: '0 14px', marginBottom: 10 }}>
              <input type="number" inputMode="decimal" value={cMonthly} onChange={e => setCMonthly(e.target.value)} placeholder="Monthly contribution (optional)"
                style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 14, padding: '11px 0' }} />
              <span style={{ fontSize: 11, color: 'var(--faint)', fontWeight: 700 }}>TND/mo</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowForm(false); setCName(''); setCIcon(''); setCTarget(''); setCDeadline(''); setCMonthly('') }} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={addChallenge} className="btn-pink" style={{ flex: 2 }} disabled={!cName.trim() || !cTarget}>Add envelope</button>
            </div>
          </div>
        )}

        {/* Stuff all panel */}
        {showStuff && data.challenges.filter(c => c.active).length > 0 && (
          <div className="card" style={{ padding: '14px', marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>Stuff your envelopes</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
              {stats.actualRemaining.toFixed(0)} TND available — how much to add to each?
            </p>
            {data.challenges.filter(c => c.active).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{c.icon || '🎯'}</span>
                <p style={{ flex: 1, fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 8, padding: '0 10px', width: 110 }}>
                  <input
                    type="number" inputMode="decimal"
                    value={stuffAmounts[c.id] ?? (c.monthlyContribution ? String(c.monthlyContribution) : '')}
                    onChange={e => setStuffAmounts(prev => ({ ...prev, [c.id]: e.target.value }))}
                    placeholder="0"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 13, fontWeight: 600, padding: '8px 0', minWidth: 0 }}
                  />
                  <span style={{ fontSize: 10, color: 'var(--faint)', fontWeight: 600, flexShrink: 0 }}>TND</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => { setShowStuff(false); setStuffAmounts({}) }} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={confirmStuff} className="btn-pink" style={{ flex: 2 }}>Confirm</button>
            </div>
          </div>
        )}

        {/* Envelope grid */}
        {data.challenges.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {data.challenges.map(c => (
              <EnvelopeCard
                key={c.id}
                challenge={c}
                onSetMonthAmount={setMonthAmount}
                onToggleEssential={toggleEssential}
                onDelete={deleteChallenge}
                monthsLeft={monthsLeft}
              />
            ))}
          </div>
        ) : (
          !showForm && (
            <div style={{ textAlign: 'center', padding: '52px 0' }}>
              <p style={{ fontSize: 44, margin: '0 0 12px' }}>✉️</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 5px', letterSpacing: '-0.3px' }}>No envelopes yet</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Tap + to create your first saving goal</p>
            </div>
          )
        )}
      </div>

      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
