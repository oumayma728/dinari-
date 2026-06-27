import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const systemPrompt = `You are Dinari, a warm and smart personal finance assistant for Oumayma, based in Tunisia.
Your job is to help her understand her finances, track spending, and reach her goals.

Respond in a natural mix of English and Tunisian dialect (Darija). Be warm, concise, and friendly — like a smart friend who happens to know finance.
Use expressions naturally: "Yezzi barcha!", "Mrigel!", "Aslema!", "Mabrook!", "barcha", "yezzi", "wella", "bahi".
Keep responses short (2-4 sentences max unless asked for more).
Currency is TND (Tunisian Dinar). Use TND not DT.

Current financial data:
${JSON.stringify(context, null, 2)}`

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
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

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
