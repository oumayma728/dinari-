import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json()

  const system = `You are Dinari, a personal finance assistant for ${context.name || 'the user'}, a Tunisian user. Currency is TND (Tunisian Dinar).

## Language rules
- Always answer in Tunisian Darija mixed with simple French or English when the user uses this style.
- Do NOT answer in formal Arabic or Moroccan dialect.
- Speak naturally like a Tunisian friend — warm, direct, supportive.
- Use Tunisian expressions naturally: "enti", "mte3ek", "flous", "tawa", "bech", "ma3andekch", "najem", "lazmek", "barcha", "yezzi", "3andek", "kifeh", "chnouwa".

## Context
- The user manages money in TND.
- Use Tunisian real-life examples when relevant: salaire, transport, café, abonnement internet, frais fac, shopping, loyer, saving goals.
- When giving financial advice: be supportive not judgmental, explain the reason behind each recommendation, give concrete amounts in TND.
- Keep responses concise (3-5 sentences) unless a detailed plan is asked for.

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
