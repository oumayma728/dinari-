'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Mic } from 'lucide-react'
import { loadData, getMonthStats, getMonthTransactions } from '@/lib/storage'
import { AppData } from '@/lib/types'
import BottomNav from '@/components/BottomNav'

interface Message { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  "How much did I spend this month?",
  "What's my biggest expense?",
  "Am I on track with my goals?",
  "Wesh hal mes finances?",
]

export default function Chat() {
  const [data, setData] = useState<AppData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setData(loadData()) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const buildContext = (d: AppData) => {
    const txs = getMonthTransactions(d, new Date())
    const { income, expenses, balance } = getMonthStats(txs, new Date())
    return { name: d.name, monthlyIncome: d.monthlyIncome, currentMonth: { income, expenses, balance }, goals: d.goals, recentTransactions: d.transactions.slice(0, 20) }
  }

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading || !data) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, context: buildContext(data) }),
      })
      const reader = res.body?.getReader(); const decoder = new TextDecoder(); let full = ''
      setMessages(m => [...m, { role: 'assistant', content: '' }])
      while (reader) {
        const { done, value } = await reader.read(); if (done) break
        full += decoder.decode(value)
        setMessages(m => { const u = [...m]; u[u.length - 1] = { role: 'assistant', content: full }; return u })
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Oops, something went wrong. Check your connection." }])
    }
    setLoading(false)
  }

  const startVoice = () => {
    const SR: (new () => SpeechRecognition) | undefined = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) return
    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'
    r.onresult = (e: SpeechRecognitionEvent) => send(e.results[0][0].transcript)
    r.onend = () => setListening(false)
    r.start(); setListening(true)
  }

  const navH = 'calc(72px + env(safe-area-inset-bottom))'
  const inputBarH = 'calc(64px + env(safe-area-inset-bottom))'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 20px 16px', background: 'rgba(245,244,241,0.92)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 2px', letterSpacing: '-0.6px' }}>Ask Dinari</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, fontWeight: 500 }}>Your smart finance companion</p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: `calc(${navH} + 70px)` }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
              <p style={{ fontSize: 44, margin: '0 0 10px' }}>🤖</p>
              <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.3px' }}>Ask me anything</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>About your spending, goals, or finances</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background: 'white', border: 'none', borderRadius: 14, padding: '13px 16px',
                  textAlign: 'left', fontSize: 14, color: 'var(--text)', cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)', fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  {s}
                  <span style={{ color: 'var(--text-faint)', fontSize: 16 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={{
              maxWidth: '80%', padding: '11px 15px',
              borderRadius: m.role === 'user' ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
              background: m.role === 'user' ? 'var(--primary)' : 'white',
              color: m.role === 'user' ? 'white' : 'var(--text)',
              fontSize: 14, lineHeight: 1.55, fontWeight: m.role === 'user' ? 500 : 400,
              boxShadow: m.role === 'assistant' ? 'var(--shadow-sm)' : 'none',
              letterSpacing: '-0.1px',
            }}>
              {m.content || (loading && i === messages.length - 1
                ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                : null)}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'rgba(245,244,241,0.95)', backdropFilter: 'blur(20px)',
        borderTop: '0.5px solid var(--border)',
        padding: `10px 16px calc(${navH} + 6px)`,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={startVoice} style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: listening ? 'var(--danger)' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          }}>
            <Mic size={17} color={listening ? 'white' : 'var(--text-muted)'} />
          </button>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask anything…"
            style={{ flex: 1, padding: '11px 16px', borderRadius: 100, border: 'none', background: 'white', fontSize: 14, color: 'var(--text)', outline: 'none', boxShadow: 'var(--shadow-sm)' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: input.trim() ? 'var(--primary)' : 'rgba(26,22,20,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
            transition: 'background 0.15s',
          }}>
            {loading
              ? <Loader2 size={16} color="white" style={{ animation: 'spin 0.8s linear infinite' }} />
              : <Send size={16} color={input.trim() ? 'white' : 'var(--text-faint)'} />}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <BottomNav />
    </div>
  )
}
