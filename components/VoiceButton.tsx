'use client'
import { useState, useRef } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'

interface Props {
  onResult: (text: string) => void
  label?: string
}

export default function VoiceButton({ onResult, label = 'Tap & speak' }: Props) {
  const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [display, setDisplay] = useState('')
  const transcriptRef = useRef('')
  const recogRef = useRef<SpeechRecognition | null>(null)

  const toggle = () => {
    if (state === 'listening') { recogRef.current?.stop(); return }
    if (state === 'processing') return

    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) { alert('Voice input requires Safari on iPhone.\nSettings → Safari → Microphone → Allow'); return }

    transcriptRef.current = ''; setDisplay('')
    const r: SpeechRecognition = new SR()
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1
    r.onstart = () => setState('listening')
    r.onresult = (e: SpeechRecognitionEvent) => { transcriptRef.current = e.results[e.results.length - 1][0].transcript; setDisplay(transcriptRef.current) }
    r.onerror = () => { setState('idle'); setDisplay('') }
    r.onend = () => {
      const t = transcriptRef.current; transcriptRef.current = ''; setDisplay('')
      if (t.trim()) { setState('processing'); onResult(t); setState('idle') }
      else setState('idle')
    }
    recogRef.current = r
    try { r.start() } catch { setState('idle') }
  }

  const isListening = state === 'listening'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {display && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>"{display}"</p>
      )}
      <button onClick={toggle} disabled={state === 'processing'} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: isListening ? 'var(--pink)' : 'white',
        color: isListening ? 'white' : 'var(--pink)',
        border: `1.5px solid ${isListening ? 'var(--pink)' : 'rgba(196,96,122,0.3)'}`,
        borderRadius: 100, padding: '11px 24px', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: isListening ? '0 0 0 4px rgba(196,96,122,0.15)' : 'var(--shadow)',
      }}>
        {state === 'processing' ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
          : isListening ? <Square size={14} fill="white" />
          : <Mic size={16} />}
        {state === 'processing' ? 'Processing…' : isListening ? 'Tap to stop' : label}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
