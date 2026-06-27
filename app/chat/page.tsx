'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Mic } from 'lucide-react'
import { loadData } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

interface Msg { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Am I on track this month?',
  'How can I save more?',
  'Can I afford my wishlist?',
  'Wesh hal budget mteai?',
]

export default function ChatPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setData(loadData()) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const context = data ? {
    name: data.name,
    income: data.monthlyIncome,
    fixedExpenses: data.fixedExpenses,
    currentPlan: data.currentPlan,
    trackedSpent: data.trackedExpenses.reduce((s, t) => s + t.amount, 0),
    wishlist: data.wishlist,
  } : {}

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    const next: Msg[] = [...msgs, { role: 'user', content: msg }]
    setMsgs(next)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context }),
      })
      const reader = res.body?.getReader(); const dec = new TextDecoder(); let full = ''
      setMsgs(m => [...m, { role: 'assistant', content: '' }])
      while (reader) {
        const { done, value } = await reader.read(); if (done) break
        full += dec.decode(value)
        setMsgs(m => { const u = [...m]; u[u.length - 1] = { role: 'assistant', content: full }; return u })
      }
    } catch { setMsgs(m => [...m, { role: 'assistant', content: "Connection issue. Try again." }]) }
    setLoading(false)
  }

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return
    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'; r.interimResults = false
    r.onresult = (e: SpeechRecognitionEvent) => send(e.results[0][0].transcript)
    r.onend = () => setListening(false)
    r.start(); setListening(true)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: 'calc(28px + env(safe-area-inset-top)) 24px 16px', borderBottom: '0.5px solid rgba(196,96,122,0.1)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 3px', letterSpacing: '-0.8px' }}>Ask AI</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Your personal finance advisor</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', paddingBottom: 'calc(72px + env(safe-area-inset-bottom) + 72px)' }}>
        {msgs.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
              <p style={{ fontSize: 40, margin: '0 0 10px' }}>🤖</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Ask me anything</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>About your budget, savings, or money</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background: 'white', border: 'none', borderRadius: 14, padding: '14px 16px',
                  textAlign: 'left', fontSize: 14, color: 'var(--text)', cursor: 'pointer',
                  boxShadow: 'var(--shadow)', fontWeight: 500, display: 'flex', justifyContent: 'space-between',
                }}>
                  {s} <span style={{ color: 'var(--text-faint)' }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={{
              maxWidth: '80%', padding: '11px 15px',
              borderRadius: m.role === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
              background: m.role === 'user' ? 'var(--pink)' : 'white',
              color: m.role === 'user' ? 'white' : 'var(--text)',
              fontSize: 14, lineHeight: 1.55, fontWeight: m.role === 'user' ? 500 : 400,
              boxShadow: m.role === 'assistant' ? 'var(--shadow)' : 'none',
            }}>
              {m.content || (loading && i === msgs.length - 1
                ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                : null)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'rgba(253,250,250,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '0.5px solid rgba(196,96,122,0.1)',
        padding: `10px 16px calc(72px + env(safe-area-inset-bottom) + 6px)`,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={startVoice} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, background: listening ? 'var(--pink)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow)', cursor: 'pointer' }}>
            <Mic size={17} color={listening ? 'white' : 'var(--text-muted)'} />
          </button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask anything…"
            style={{ flex: 1, padding: '11px 16px', borderRadius: 100, border: 'none', background: 'white', fontSize: 14, color: 'var(--text)', outline: 'none', boxShadow: 'var(--shadow)' }} />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, background: input.trim() ? 'var(--pink)' : 'rgba(26,22,20,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}>
            {loading ? <Loader2 size={16} color="white" style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={16} color={input.trim() ? 'white' : 'var(--text-faint)'} />}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <BottomNav />
    </div>
  )
}
