'use client'
import { useState, useEffect, useRef } from 'react'
import { Mic, Square, Check, X, Loader2 } from 'lucide-react'
import { loadData, saveData } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

interface ParsedTx {
  type: 'income' | 'expense'
  amount: number
  description: string
  categoryId: string
  categoryName: string
}

export default function VoicePage() {
  const [data, setData] = useState<AppData | null>(null)
  const [state, setState] = useState<'idle' | 'listening' | 'parsing' | 'preview' | 'done'>('idle')
  const [transcript, setTranscript] = useState('')
  const [parsed, setParsed] = useState<ParsedTx | null>(null)
  const [error, setError] = useState('')
  const transcriptRef = useRef('')
  const recogRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => { setData(loadData()) }, [])

  if (!data) return null

  const reset = () => { setState('idle'); setTranscript(''); setParsed(null); setError(''); transcriptRef.current = '' }

  const toggleListen = () => {
    if (state === 'listening') { recogRef.current?.stop(); return }
    if (state !== 'idle') return

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { setError('Voice requires Safari on iPhone. Settings → Safari → Microphone → Allow'); return }

    transcriptRef.current = ''; setTranscript(''); setError('')
    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1

    r.onstart = () => setState('listening')
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[e.results.length - 1][0].transcript
      transcriptRef.current = t; setTranscript(t)
    }
    r.onerror = () => { setState('idle'); setError('Could not capture voice. Try again.') }
    r.onend = async () => {
      const final = transcriptRef.current
      if (!final.trim()) { setState('idle'); return }
      setState('parsing')
      try {
        const res = await fetch('/api/parse-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: final, categories: data.categories.map(c => ({ id: c.id, name: c.name })) }),
        })
        const result = await res.json()
        if (result.amount && result.categoryId) {
          setParsed(result); setState('preview')
        } else {
          setError("Couldn't understand that. Try: \"Spent 30 dinars on groceries\"")
          setState('idle')
        }
      } catch {
        setError('Connection error. Check your internet.'); setState('idle')
      }
    }
    recogRef.current = r
    try { r.start() } catch { setState('idle') }
  }

  const confirm = () => {
    if (!parsed) return
    const newTx = { id: crypto.randomUUID(), type: parsed.type, amount: parsed.amount, date: new Date().toISOString().split('T')[0], description: parsed.description, categoryId: parsed.categoryId, createdAt: new Date().toISOString() }
    const updated = saveData({ ...data, transactions: [newTx, ...data.transactions] })
    setData({ ...updated })
    setState('done')
    setTimeout(reset, 2000)
  }

  const isListening = state === 'listening'
  const isParsing = state === 'parsing'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(24px + env(safe-area-inset-top)) 20px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>

        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.7px' }}>Voice input</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 0', fontWeight: 500 }}>
          Say something like: <em style={{ color: 'var(--pink)' }}>"Spent 30 dinars on groceries"</em>
        </p>

        {/* Center area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, paddingBottom: 80 }}>

          {/* Done state */}
          {state === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={40} color="var(--success)" strokeWidth={2.5} />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Saved!</p>
              <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Transaction logged</p>
            </div>
          )}

          {/* Preview card */}
          {state === 'preview' && parsed && (
            <div className="card" style={{ width: '100%', padding: '20px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 14px' }}>Confirm transaction</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{parsed.description}</span>
                <span className="num" style={{ fontSize: 22, fontWeight: 700, color: parsed.type === 'income' ? 'var(--success)' : 'var(--pink)' }}>
                  {parsed.type === 'income' ? '+' : '−'}{parsed.amount.toFixed(0)} TND
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 18px', fontWeight: 500 }}>
                {parsed.type === 'expense' ? 'Expense' : 'Income'} · {parsed.categoryName}
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={reset} style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', background: 'var(--bg)', color: 'var(--muted)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <X size={16} /> Cancel
                </button>
                <button onClick={confirm} className="btn-pink" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Check size={16} /> Confirm
                </button>
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcript && state !== 'preview' && (
            <div style={{ background: 'var(--card)', borderRadius: 16, padding: '14px 18px', width: '100%', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: 'var(--text)', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>
                "{transcript}"
              </p>
            </div>
          )}

          {/* Mic button */}
          {(state === 'idle' || state === 'listening') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <button
                onClick={toggleListen}
                style={{
                  width: 96, height: 96, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: isListening ? 'var(--pink)' : 'var(--card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isListening
                    ? '0 0 0 8px rgba(196,96,122,0.15), 0 0 0 16px rgba(196,96,122,0.07)'
                    : 'var(--shadow)',
                  transition: 'all 0.2s',
                }}
              >
                {isListening
                  ? <Square size={32} fill="white" color="white" />
                  : <Mic size={36} color="var(--pink)" strokeWidth={1.8} />}
              </button>
              <p style={{ fontSize: 14, fontWeight: 600, color: isListening ? 'var(--pink)' : 'var(--muted)', margin: 0, letterSpacing: '-0.2px' }}>
                {isListening ? 'Tap to stop' : 'Tap to speak'}
              </p>
            </div>
          )}

          {/* Parsing spinner */}
          {isParsing && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Loader2 size={40} color="var(--pink)" style={{ animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', margin: 0 }}>Understanding your message…</p>
            </div>
          )}

          {error && (
            <div style={{ background: '#FEE8E8', borderRadius: 14, padding: '14px 16px', width: '100%', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#C4736A', margin: 0, fontWeight: 500 }}>{error}</p>
            </div>
          )}
        </div>

        {/* Hint */}
        {state === 'idle' && !error && (
          <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--pink-faint)', borderRadius: 14 }}>
            <p className="label" style={{ margin: '0 0 6px' }}>Examples</p>
            {['"Spent 50 dinars on groceries"', '"Received 1500 TND salary"', '"Paid 30 for transport"'].map(ex => (
              <p key={ex} style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0', fontStyle: 'italic' }}>{ex}</p>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div className="pb-nav" />
      <BottomNav />
    </div>
  )
}
