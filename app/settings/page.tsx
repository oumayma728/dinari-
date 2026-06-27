'use client'
import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return null

  const persist = (d: AppData) => { saveData(d); setData({ ...d }); setSaved(true); setTimeout(() => setSaved(false), 1500) }

  const f: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 14, border: 'none',
    background: 'var(--pink-faint)', fontSize: 15, color: 'var(--text)', outline: 'none',
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.8px' }}>Settings</h1>
          {saved && <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Saved</span>}
        </div>

        <p className="label" style={{ margin: '0 0 10px' }}>Profile</p>
        <div style={{ background: 'white', borderRadius: 18, padding: '18px', boxShadow: 'var(--shadow)', marginBottom: 28 }}>
          <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '0 0 6px', fontWeight: 500 }}>Your name</p>
          <input defaultValue={data.name} onBlur={e => persist({ ...data, name: e.target.value.trim() || data.name })} style={{ ...f, marginBottom: 14 }} />
          <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '0 0 6px', fontWeight: 500 }}>Monthly income (TND)</p>
          <input type="number" defaultValue={data.monthlyIncome || ''} onBlur={e => persist({ ...data, monthlyIncome: parseFloat(e.target.value) || 0 })} placeholder="e.g. 2000" style={f} />
        </div>

        <p className="label" style={{ margin: '0 0 10px' }}>Data</p>
        <div style={{ background: 'white', borderRadius: 18, padding: '18px', boxShadow: 'var(--shadow)', marginBottom: 28 }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
            Manage fixed expenses in the <strong>Expenses</strong> tab.<br />
            Manage your wishlist in the <strong>Wishlist</strong> tab.
          </p>
          <button
            onClick={() => { if (confirm('Reset all data? This cannot be undone.')) { localStorage.clear(); window.location.reload() } }}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(196,96,122,0.3)', background: 'none', color: 'var(--pink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Reset all data
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-faint)', textAlign: 'center', fontWeight: 500 }}>
          All data stored locally on your device 🔒
        </p>
      </div>
      <div className="safe-b" />
      <BottomNav />
    </div>
  )
}
