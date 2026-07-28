'use client'
import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

const SWATCHES = [
  { id: 'pink',   label: 'Pink',   color: '#C4607A', light: '#F9EEF1', faint: '#FDF5F7' },
  { id: 'teal',   label: 'Teal',   color: '#3D8A7A', light: '#EAF5F3', faint: '#F2FAF9' },
  { id: 'blue',   label: 'Blue',   color: '#4A72B0', light: '#EBF0FA', faint: '#F3F6FD' },
  { id: 'amber',  label: 'Amber',  color: '#A07030', light: '#F8F0E5', faint: '#FBF7F2' },
  { id: 'purple', label: 'Purple', color: '#7A5AB0', light: '#F0EBF8', faint: '#F6F3FB' },
]

function applyTheme(color: string, light: string, faint: string) {
  document.documentElement.style.setProperty('--pink', color)
  document.documentElement.style.setProperty('--pink-hover', color)
  document.documentElement.style.setProperty('--pink-light', light)
  document.documentElement.style.setProperty('--pink-faint', faint)
}

export default function SettingsPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [saved, setSaved] = useState(false)
  const [importError, setImportError] = useState('')

  useEffect(() => {
    const d = loadData()
    setData(d)
    if (d.themeColor) {
      const sw = SWATCHES.find(s => s.color === d.themeColor) ?? SWATCHES[0]
      applyTheme(sw.color, sw.light, sw.faint)
    }
  }, [])

  if (!data) return null

  const persist = (d: AppData) => {
    saveData(d); setData({ ...d })
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }

  const currentSwatch = SWATCHES.find(s => s.color === data.themeColor) ?? SWATCHES[0]

  const selectTheme = (sw: typeof SWATCHES[0]) => {
    applyTheme(sw.color, sw.light, sw.faint)
    persist({ ...data, themeColor: sw.color })
  }

  const exportData = () => {
    const raw = localStorage.getItem('dinari_v4')
    if (!raw) { alert('No data to export.'); return }
    const date = new Date().toISOString().slice(0, 10)
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `dinari-backup-${date}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  const importData = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      if (!confirm('This will overwrite all current data. Continue?')) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string)
          if (!Array.isArray(parsed.transactions) || !Array.isArray(parsed.categories)) {
            setImportError('Invalid file — missing required data. Make sure it\'s a Dinari backup.')
            return
          }
          saveData(parsed); setData({ ...parsed })
          setImportError('')
          setSaved(true); setTimeout(() => setSaved(false), 1500)
        } catch {
          setImportError('Could not read file. Make sure it\'s a valid Dinari .json backup.')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.7px' }}>Settings</h1>
          {saved && (
            <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={13} /> Saved
            </span>
          )}
        </div>

        {/* Name */}
        <p className="label" style={{ margin: '0 0 8px' }}>Your name</p>
        <input defaultValue={data.name} onBlur={e => persist({ ...data, name: e.target.value.trim() || data.name })}
          className="field" style={{ marginBottom: 24 }} />

        {/* Theme */}
        <p className="label" style={{ margin: '0 0 10px' }}>Accent color</p>
        <div className="card" style={{ padding: '16px 18px', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
            {SWATCHES.map(sw => (
              <button key={sw.id} onClick={() => selectTheme(sw)} title={sw.label} style={{
                width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: sw.color, flexShrink: 0,
                boxShadow: currentSwatch.id === sw.id
                  ? `0 0 0 2px white, 0 0 0 4px ${sw.color}`
                  : '0 2px 6px rgba(0,0,0,0.15)',
                transition: 'box-shadow 0.15s',
              }} />
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            Current: <strong>{currentSwatch.label}</strong>
          </p>
        </div>

        {/* Backup & restore */}
        <p className="label" style={{ margin: '0 0 10px' }}>Backup & restore</p>
        <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.6 }}>
            Data lives on this device only. Export a backup to keep it safe or transfer to a new phone.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportData} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'none',
              color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              📥 Export
            </button>
            <button onClick={importData} style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: '1.5px solid var(--border)', background: 'none',
              color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              📤 Import
            </button>
          </div>
          {importError && (
            <p style={{ fontSize: 12, color: 'var(--pink)', margin: '10px 0 0', fontWeight: 500 }}>{importError}</p>
          )}
        </div>

        {/* Reset */}
        <div className="card" style={{ padding: '16px 18px', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>Danger zone</p>
          <button onClick={() => { if (confirm('Reset all data? This cannot be undone.')) { localStorage.clear(); window.location.reload() } }}
            style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(196,96,122,0.3)', background: 'none', color: 'var(--pink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Reset all data
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--faint)', textAlign: 'center', fontWeight: 500 }}>Stored locally 🔒</p>
      </div>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
