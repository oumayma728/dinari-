'use client'
import { useState, useRef } from 'react'
import { Download, Upload, Check } from 'lucide-react'
import { exportData, importData } from '@/lib/storage'
import BottomNav from '@/components/BottomNav'

export default function SettingsPage() {
  const [exported, setExported] = useState(false)
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `dinari-backup-${date}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setExported(true)
    setTimeout(() => setExported(false), 2000)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = importData(String(reader.result))
      if (result.ok) {
        setImportMsg({ ok: true, text: 'Data restored. Reloading…' })
        setTimeout(() => window.location.reload(), 1200)
      } else {
        setImportMsg({ ok: false, text: result.error })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0' }}>

        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 20px', letterSpacing: '-0.7px', color: 'var(--text)' }}>Settings</h1>

        <p className="label" style={{ margin: '0 0 10px' }}>Backup</p>

        <div className="card" style={{ padding: '16px', marginBottom: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>Export your data</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
            Downloads everything — income, transactions, categories, envelopes, and wishlist — as a single JSON file you can keep safe.
          </p>
          <button
            onClick={handleExport}
            className="btn-pink"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
          >
            {exported ? <Check size={15} /> : <Download size={15} />}
            {exported ? 'Downloaded' : 'Export data'}
          </button>
        </div>

        <div className="card" style={{ padding: '16px', marginBottom: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '0 0 4px' }}>Restore from backup</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
            This replaces your current data with whatever is in the file you choose.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleImportClick}
            className="btn-ghost"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}
          >
            <Upload size={15} />
            Import data
          </button>
          {importMsg && (
            <p style={{ fontSize: 12, fontWeight: 600, margin: '10px 0 0', color: importMsg.ok ? 'var(--success)' : '#A6435F' }}>
              {importMsg.text}
            </p>
          )}
        </div>

      </div>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}