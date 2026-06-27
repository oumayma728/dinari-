'use client'
import { useState, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  onTransaction: (data: { amount: number; type: string; category: string; description: string }) => void
}

export default function VoiceButton({ categories, onTransaction }: Props) {
  const [state, setState] = useState<'idle' | 'listening' | 'parsing'>('idle')
  const [transcript, setTranscript] = useState('')
  const recogRef = useRef<SpeechRecognition | null>(null)

  const start = () => {
    const SR: { new(): SpeechRecognition } | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice not supported on this browser. Try Safari on iPhone.'); return }
    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = Array.from(e.results).map((res: SpeechRecognitionResult) => res[0].transcript).join('')
      setTranscript(t)
    }
    r.onend = async () => {
      const final = transcript
      if (!final.trim()) { setState('idle'); return }
      setState('parsing')
      try {
        const res = await fetch('/api/parse-transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: final, categories: categories.map(c => c.name) }),
        })
        const data = await res.json()
        if (data.amount) onTransaction(data)
      } catch (e) {
        console.error(e)
      }
      setState('idle')
      setTranscript('')
    }
    recogRef.current = r
    r.start()
    setState('listening')
  }

  const stop = () => {
    recogRef.current?.stop()
  }

  const isListening = state === 'listening'
  const isParsing = state === 'parsing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {transcript && (
        <div style={{
          background: 'white', borderRadius: 12, padding: '8px 14px',
          border: '0.5px solid var(--border)', fontSize: 13,
          color: 'var(--text-muted)', maxWidth: 280, textAlign: 'center',
        }}>
          "{transcript}"
        </div>
      )}
      <button
        onMouseDown={start}
        onMouseUp={stop}
        onTouchStart={start}
        onTouchEnd={stop}
        disabled={isParsing}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: isListening ? 'var(--danger)' : 'var(--primary)',
          color: 'white', border: 'none', borderRadius: 50,
          padding: '12px 24px', fontSize: 14, fontWeight: 500,
          transition: 'all 0.2s',
          boxShadow: isListening ? '0 0 0 6px rgba(196,115,106,0.2)' : 'none',
        }}
      >
        {isParsing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> :
          isListening ? <MicOff size={18} /> : <Mic size={18} />}
        {isParsing ? 'Processing...' : isListening ? 'Release to log' : 'Hold & speak'}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
