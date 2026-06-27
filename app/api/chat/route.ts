import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const system = `You are Dinari, a smart and warm personal finance advisor for ${context.name || 'the user'}, based in Tunisia. Currency is TND (Tunisian Dinar).

Respond in a natural mix of English and Tunisian dialect (Darija). Be direct, honest, and helpful — like a smart friend who knows finance well. Be specific with numbers. Keep responses concise (3-5 sentences) unless the user asks for a detailed plan.

The user's current financial snapshot:
- Salary this month: ${context.salary} TND
- Left over from last month: ${context.carryover} TND
- Total balance: ${context.totalBalance} TND
- Planned remaining (after budgeted categories): ${context.plannedRemaining} TND
- Actual remaining (after real spending): ${context.actualRemaining} TND

Categories (active this month):
${JSON.stringify(context.categories?.filter((c: any) => c.active), null, 2)}

Saving challenges:
${JSON.stringify(context.challenges, null, 2)}

Wishlist:
${JSON.stringify(context.wishlist, null, 2)}

Recent transactions:
${JSON.stringify(context.recentTransactions, null, 2)}

When the user asks to optimize: suggest specific categories to reduce based on priority and spending.
When they ask about wishlist: calculate months needed based on actual savings capacity.
When budget is negative: be honest and suggest concrete cuts.`

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'system', content: system }, ...messages],
    stream: true,
    max_tokens: 500,
    temperature: 0.65,
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
