'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Mic, Square, Loader2, Trash2 } from 'lucide-react'
import { loadData, calcStats, getCategorySpent } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

interface Msg { role: 'user' | 'assistant'; content: string }

const CHAT_KEY = 'dinari_chat'

function loadMsgs(): Msg[] {
  try { return JSON.parse(localStorage.getItem(CHAT_KEY) || '[]') } catch { return [] }
}
function saveMsgs(msgs: Msg[]) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(msgs))
}

const SUGGESTIONS = [
  "How am I doing this month?",
  "Where am I spending the most?",
  "Help me optimize my budget",
  "Can I afford my wishlist?",
  "Wesh hal mes finances?",
]

export default function AIPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const transcriptRef = useRef('')
  const recogRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => { setData(loadData()); setMsgs(loadMsgs()) }, [])
  useEffect(() => { if (msgs.length > 0) saveMsgs(msgs); endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const buildContext = (d: AppData) => {
    const stats = calcStats(d)
    const receivedIncome = d.incomeSources.filter(s => s.received).reduce((sum, s) => sum + s.amount, 0)
    const pendingIncome = d.incomeSources.filter(s => !s.received).reduce((sum, s) => sum + s.amount, 0)
    return {
      name: d.name,
      incomeSources: d.incomeSources.map(s => ({ name: s.name, amount: s.amount, received: s.received, day: s.day })),
      receivedIncome,
      pendingIncome,
      carryover: d.carryover,
      totalBalance: stats.balance,
      plannedRemaining: stats.plannedRemaining,
      actualRemaining: stats.actualRemaining,
      categories: d.categories.map(c => ({
        name: c.name,
        type: c.type,
        budget: c.budget,
        spent: getCategorySpent(d, c.id),
        left: c.budget - getCategorySpent(d, c.id),
        active: c.activeThisMonth,
        priority: c.priority,
      })),
      challenges: d.challenges.map(c => ({ name: c.name, target: c.targetAmount, saved: c.savedAmount, active: c.active })),
      wishlist: d.wishlistGroups.flatMap(g => g.items.filter(i => !i.bought).map(i => ({ group: g.title, name: i.name, price: i.price }))),
      recentTransactions: d.transactions.slice(0, 15).map(t => {
        const cat = d.categories.find(c => c.id === t.categoryId)
        return { type: t.type, amount: t.amount, description: t.description, category: cat?.name, date: t.date }
      }),
    }
  }

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading || !data) return
    setInput('')
    const next: Msg[] = [...msgs, { role: 'user', content: msg }]
    setMsgs(next)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, context: buildContext(data) }),
      })
      const reader = res.body?.getReader()
      const dec = new TextDecoder()
      let full = ''
      setMsgs(m => [...m, { role: 'assistant', content: '' }])
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        full += dec.decode(value)
        setMsgs(m => { const u = [...m]; u[u.length - 1] = { role: 'assistant', content: full }; return u })
      }
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'Connection issue. Try again.' }])
    }
    setLoading(false)
  }, [input, loading, data, msgs])

  const toggleVoice = () => {
    if (listening) { recogRef.current?.stop(); return }
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice needs Safari on iPhone.'); return }
    transcriptRef.current = ''
    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1
    r.onstart = () => setListening(true)
    r.onresult = (e: SpeechRecognitionEvent) => { transcriptRef.current = e.results[e.results.length - 1][0].transcript }
    r.onerror = () => setListening(false)
    r.onend = () => { setListening(false); if (transcriptRef.current.trim()) send(transcriptRef.current) }
    recogRef.current = r
    try { r.start() } catch { setListening(false) }
  }

  if (!data) return null

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: 'calc(24px + env(safe-area-inset-top)) 20px 14px',
        background: 'rgba(247,244,242,0.96)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 2px', letterSpacing: '-0.6px' }}>AI Advisor</h1>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, fontWeight: 500 }}>
            Ask anything about your budget
          </p>
        </div>
        {msgs.length > 0 && (
          <button onClick={() => { setMsgs([]); localStorage.removeItem(CHAT_KEY) }} style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--faint)', fontSize: 12, fontWeight: 500 }}>
            <Trash2 size={14} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', paddingBottom: 'calc(68px + env(safe-area-inset-bottom) + 68px)' }}>

        {msgs.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0 28px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤖</div>
              <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.4px' }}>Hey {data.name}!</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Ask me about your budget, spending,<br />or how to save more this month.</p>
            </div>
            <p className="label" style={{ margin: '0 0 10px' }}>Try asking</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background: 'white', border: 'none', borderRadius: 14, padding: '13px 16px',
                  textAlign: 'left', fontSize: 14, color: 'var(--text)', cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)', fontWeight: 500,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span>{s}</span>
                  <span style={{ color: 'var(--faint)', fontSize: 18, lineHeight: 1 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2 }}>
                  🤖
                </div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '11px 15px',
                borderRadius: m.role === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
                background: m.role === 'user' ? '#1C2A2B' : 'white',
                color: m.role === 'user' ? 'white' : 'var(--text)',
                fontSize: 14, lineHeight: 1.6,
                fontWeight: m.role === 'user' ? 500 : 400,
                boxShadow: m.role === 'assistant' ? 'var(--shadow-sm)' : 'none',
                letterSpacing: '-0.1px',
              }}>
                {m.content || (loading && i === msgs.length - 1
                  ? <Loader2 size={15} color="var(--muted)" style={{ animation: 'spin 0.8s linear infinite' }} />
                  : null)}
              </div>
            </div>
          ))}
        </div>

        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'rgba(247,244,242,0.97)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderTop: '0.5px solid var(--border)',
        padding: `10px 16px calc(68px + env(safe-area-inset-bottom) + 6px)`,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Voice button */}
          <button onClick={toggleVoice} style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
            background: listening ? 'var(--pink)' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: listening ? '0 0 0 4px rgba(196,96,122,0.2)' : 'var(--shadow-sm)',
            transition: 'all 0.15s',
          }}>
            {listening
              ? <Square size={14} fill="white" color="white" />
              : <Mic size={17} color="var(--pink)" strokeWidth={1.8} />}
          </button>

          {/* Text input */}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={listening ? 'Listening…' : 'Ask about your budget…'}
            disabled={listening}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 100, border: 'none',
              background: 'white', fontSize: 14, color: 'var(--text)', outline: 'none',
              boxShadow: 'var(--shadow-sm)',
              opacity: listening ? 0.5 : 1,
            }}
          />

          {/* Send button */}
          <button onClick={() => send()} disabled={!input.trim() || loading || listening} style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0, cursor: 'pointer',
            background: input.trim() && !loading && !listening ? '#1C2A2B' : 'rgba(26,22,20,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
          }}>
            {loading
              ? <Loader2 size={16} color="white" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Send size={15} color={input.trim() && !listening ? 'white' : 'var(--faint)'} />}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <BottomNav />
    </div>
  )
}
