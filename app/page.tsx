'use client'
import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Loader2, RefreshCw } from 'lucide-react'
import { loadData, saveData, calcTotals } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import { format } from 'date-fns'

export default function Overview() {
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setData(loadData()) }, [])

  const update = (patch: Partial<AppData>) => {
    if (!data) return
    const updated = saveData({ ...data, ...patch })
    setData({ ...updated })
  }

  const refreshInsights = useCallback(async () => {
    if (!data || loading) return
    setLoading(true)
    try {
      const totals = calcTotals(data)
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, balance: data.balance, nextMonthIncome: data.nextMonthIncome, expenses: data.expenses, wishlist: data.wishlist, totals }),
      })
      const insights = await res.json()
      update({ insights: { ...insights, generatedAt: new Date().toISOString() } })
    } catch { /* silent */ }
    setLoading(false)
  }, [data, loading])

  if (!data) return null

  const t = calcTotals(data)
  const remainingColor = t.remaining >= 0 ? 'var(--success)' : 'var(--pink)'
  const month = format(new Date(), 'MMMM yyyy')

  const Row = ({ label, value, color }: { label: string; value: number; color?: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderTop: '0.5px solid var(--border)' }}>
      <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      <span className="num" style={{ fontSize: 15, fontWeight: 700, color: color || 'var(--text)' }}>
        {value >= 0 ? '' : '−'}{Math.abs(value).toFixed(0)} TND
      </span>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>

        {/* Header */}
        <p style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 700, letterSpacing: '0.3px', margin: '0 0 4px' }}>{month.toUpperCase()}</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 28px', letterSpacing: '-0.8px' }}>{data.name}</h1>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <p className="label" style={{ margin: '0 0 7px' }}>Current balance</p>
            <div className="card" style={{ padding: '14px 16px' }}>
              <input
                type="number" inputMode="decimal"
                defaultValue={data.balance || ''}
                onBlur={e => update({ balance: parseFloat(e.target.value) || 0, insights: null })}
                placeholder="0"
                style={{ width: '100%', border: 'none', outline: 'none', background: 'none', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}
              />
              <p style={{ fontSize: 11, color: 'var(--faint)', margin: '2px 0 0', fontWeight: 500 }}>TND</p>
            </div>
          </div>
          <div>
            <p className="label" style={{ margin: '0 0 7px' }}>Next month income</p>
            <div className="card" style={{ padding: '14px 16px' }}>
              <input
                type="number" inputMode="decimal"
                defaultValue={data.nextMonthIncome || ''}
                onBlur={e => update({ nextMonthIncome: parseFloat(e.target.value) || 0, insights: null })}
                placeholder="0"
                style={{ width: '100%', border: 'none', outline: 'none', background: 'none', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}
              />
              <p style={{ fontSize: 11, color: 'var(--faint)', margin: '2px 0 0', fontWeight: 500 }}>TND</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        {(data.balance > 0 || data.nextMonthIncome > 0 || data.expenses.length > 0) && (
          <div className="card" style={{ padding: '6px 18px 14px', marginBottom: 20 }}>
            <Row label="Total available" value={t.available} />
            {t.fixed > 0 && <Row label="Fixed expenses" value={-t.fixed} />}
            {t.oneTime > 0 && <Row label="One-time expenses" value={-t.oneTime} />}
            {t.variable > 0 && <Row label="Variable expenses" value={-t.variable} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '12px 0 0', marginTop: 4, borderTop: `1.5px solid ${t.remaining >= 0 ? 'var(--success-bg)' : 'var(--pink-light)'}` }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: remainingColor }}>Remaining</span>
              <span className="num" style={{ fontSize: 18, fontWeight: 700, color: remainingColor }}>
                {t.remaining >= 0 ? '' : '−'}{Math.abs(t.remaining).toFixed(0)} TND
              </span>
            </div>
          </div>
        )}

        {/* AI insights button */}
        <button
          onClick={refreshInsights}
          disabled={loading || data.expenses.length === 0}
          className="btn"
          style={{
            background: loading ? 'var(--pink-light)' : 'var(--pink)',
            color: loading ? 'var(--pink)' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 16,
            opacity: data.expenses.length === 0 ? 0.4 : 1,
          }}
        >
          {loading
            ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating insights…</>
            : data.insights
              ? <><RefreshCw size={15} /> Refresh AI suggestions</>
              : <><Sparkles size={15} /> Get AI suggestions</>}
        </button>

        {/* Overall AI insight */}
        {data.insights?.overall && (
          <div style={{ background: 'var(--pink-faint)', borderRadius: 14, padding: '14px 16px', marginBottom: 4, borderLeft: '3px solid var(--pink)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--pink)', margin: '0 0 5px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              Dinari says
            </p>
            <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
              {data.insights.overall}
            </p>
            {data.insights.generatedAt && (
              <p style={{ fontSize: 10, color: 'var(--faint)', margin: '6px 0 0', fontWeight: 500 }}>
                Updated {format(new Date(data.insights.generatedAt), 'HH:mm')}
              </p>
            )}
          </div>
        )}

        {data.expenses.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--faint)', textAlign: 'center', padding: '24px 0', fontWeight: 500 }}>
            Add expenses to get AI suggestions →
          </p>
        )}
      </div>
      <div className="pb-nav" />
      <BottomNav />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
