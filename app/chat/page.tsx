'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Mic } from 'lucide-react'
import { loadData, getMonthStats } from '@/lib/storage'
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setData(loadData()) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const buildContext = (d: AppData) => {
    const { income, expenses, balance } = getMonthStats(d)
    return {
      name: d.name,
      monthlyIncome: d.monthlyIncome,
      currentMonth: { income, expenses, balance },
      goals: d.goals,
      recentTransactions: d.transactions.slice(0, 20),
      categories: d.categories.map(c => c.name),
    }
  }

  const send = async (text?: string) => {
    const msg = text || input.trim()
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
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      setMessages(m => [...m, { role: 'assistant', content: '' }])
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setMessages(m => {
          const updated = [...m]
          updated[updated.length - 1] = { role: 'assistant', content: full }
          return updated
        })
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Oops, something went wrong. Check your connection." }])
    }
    setLoading(false)
  }

  const startVoice = () => {
    const SR: { new(): SpeechRecognition } | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript
      send(t)
    }
    r.onend = () => setListening(false)
    r.start()
    setListening(true)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 20px 12px', paddingTop: 'calc(16px + env(safe-area-inset-top)', borderBottom: '0.5px solid var(--border)', background: 'var(--bg)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Ask Dinari 🤖</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>Your smart finance companion</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom) + 80px)' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
              <p style={{ fontSize: 40, margin: '0 0 8px' }}>💬</p>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                Ask me anything about your finances.<br />
                <span style={{ color: 'var(--accent)' }}>Bashi w na9ez!</span>
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  background: 'white', border: '0.5px solid var(--border)', borderRadius: 14,
                  padding: '12px 16px', textAlign: 'left', fontSize: 14,
                  color: 'var(--text)', cursor: 'pointer',
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            <div style={{
              maxWidth: '82%', padding: '11px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user' ? 'var(--primary)' : 'white',
              color: m.role === 'user' ? 'white' : 'var(--text)',
              fontSize: 14, lineHeight: 1.5,
              border: m.role === 'assistant' ? '0.5px solid var(--border)' : 'none',
            }}>
              {m.content || (loading && i === messages.length - 1 ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : '')}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'rgba(251,249,246,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '0.5px solid var(--border)',
        padding: '12px 16px',
        paddingBottom: 'calc(80px + env(safe-area-inset-bottom) + 8px)',
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={startVoice} style={{
            width: 40, height: 40, borderRadius: '50%', border: '0.5px solid var(--border)',
            background: listening ? 'var(--danger)' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Mic size={18} color={listening ? 'white' : 'var(--text-muted)'} />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask anything..."
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 20,
              border: '0.5px solid var(--border)', background: 'white',
              fontSize: 14, color: 'var(--text)', outline: 'none',
            }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none',
            background: input.trim() ? 'var(--primary)' : 'var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {loading ? <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} color="white" />}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <BottomNav />
    </div>
  )
}
