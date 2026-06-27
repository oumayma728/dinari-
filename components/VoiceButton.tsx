'use client'
import { useState, useRef } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Category } from '@/lib/types'

interface Props {
  categories: Category[]
  onTransaction: (data: { amount: number; type: string; category: string; description: string }) => void
}

export default function VoiceButton({ categories, onTransaction }: Props) {
  const [state, setState] = useState<'idle' | 'listening' | 'parsing'>('idle')
  const [display, setDisplay] = useState('')
  // Ref holds latest transcript — fixes stale closure in onend
  const transcriptRef = useRef('')
  const recogRef = useRef<SpeechRecognition | null>(null)

  const toggle = () => {
    if (state === 'listening') {
      recogRef.current?.stop()
      return
    }
    if (state === 'parsing') return

    const SR: (new () => SpeechRecognition) | undefined =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Voice needs Safari on iPhone.\nGo to: Settings → Safari → Microphone → Allow')
      return
    }

    transcriptRef.current = ''
    setDisplay('')

    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    r.continuous = false

    r.onresult = (e: SpeechRecognitionEvent) => {
      let t = ''
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
      transcriptRef.current = t   // always fresh — no closure issue
      setDisplay(t)               // only for visual feedback
    }

    r.onerror = () => setState('idle')

    r.onend = async () => {
      const final = transcriptRef.current  // read from ref, not state
      setDisplay('')
      transcriptRef.current = ''

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
      } catch {
        // silent fail
      }
      setState('idle')
    }

    recogRef.current = r
    r.start()
    setState('listening')
  }

  const isListening = state === 'listening'
  const isParsing = state === 'parsing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {display && (
        <div style={{
          background: 'white', borderRadius: 12, padding: '8px 16px',
          boxShadow: 'var(--shadow-sm)', fontSize: 13, color: 'var(--text-muted)',
          maxWidth: 260, textAlign: 'center', fontStyle: 'italic',
        }}>
          "{display}"
        </div>
      )}
      <button
        onClick={toggle}
        disabled={isParsing}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: isListening ? 'var(--danger)' : 'var(--primary)',
          color: 'white', border: 'none', borderRadius: 100,
          padding: '13px 28px', fontSize: 14, fontWeight: 600,
          letterSpacing: '-0.1px',
          boxShadow: isListening ? '0 0 0 5px rgba(184,84,80,0.18)' : 'var(--shadow-md)',
          transition: 'background 0.15s, box-shadow 0.15s',
          cursor: isParsing ? 'not-allowed' : 'pointer',
          opacity: isParsing ? 0.7 : 1,
        }}
      >
        {isParsing
          ? <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} />
          : isListening ? <Square size={15} fill="white" />
          : <Mic size={17} />}
        {isParsing ? 'Processing…' : isListening ? 'Tap to stop' : 'Tap & speak'}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
