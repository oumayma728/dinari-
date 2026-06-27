import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const system = `You are Dinari, a warm personal finance advisor for ${context.name || 'the user'}, based in Tunisia. Currency is TND.

Respond in a natural mix of English and Tunisian dialect (Darija). Be direct, concise, and helpful — like a smart friend who knows finance. Keep responses short (2-4 sentences max unless asked for more).

Current context:
${JSON.stringify(context, null, 2)}`

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: system }, ...messages],
    stream: true,
    max_tokens: 400,
    temperature: 0.7,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
