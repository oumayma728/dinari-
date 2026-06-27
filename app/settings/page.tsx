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

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.8px' }}>Settings</h1>
          {saved && <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Saved</span>}
        </div>

        <p className="label" style={{ margin: '0 0 8px' }}>Your name</p>
        <input defaultValue={data.name}
          onBlur={e => persist({ ...data, name: e.target.value.trim() || data.name })}
          className="field" style={{ marginBottom: 28 }} />

        <p className="label" style={{ margin: '0 0 10px' }}>Data</p>
        <div className="card" style={{ padding: '16px 18px', marginBottom: 28 }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
            All your data is stored privately on this device. Nothing is sent to any server except AI suggestion requests.
          </p>
          <button
            onClick={() => { if (confirm('Reset all data?')) { localStorage.clear(); window.location.reload() } }}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(196,96,122,0.3)', background: 'none', color: 'var(--pink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Reset all data
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', fontWeight: 500 }}>
          Stored locally 🔒
        </p>
      </div>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
