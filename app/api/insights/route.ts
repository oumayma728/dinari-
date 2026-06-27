import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { name, balance, nextMonthIncome, expenses, wishlist, totals } = await req.json()

  const expList = expenses.map((e: any) =>
    `- [${e.id}] ${e.name} (${e.type}, priority: ${e.priority}): ${e.amount} TND`
  ).join('\n')

  const wList = wishlist.map((w: any) =>
    `- [${w.id}] ${w.name} (priority: ${w.priority}): ${w.price} TND`
  ).join('\n')

  const prompt = `You are a concise personal finance advisor for ${name} in Tunisia. Currency: TND.

Snapshot:
- Current balance: ${balance} TND
- Next month income: ${nextMonthIncome} TND
- Total available: ${totals.available} TND
- Total planned expenses: ${totals.total} TND
- Remaining after expenses: ${totals.remaining} TND
- Monthly savings capacity: ${totals.savingsCapacity} TND

Expenses:
${expList || 'None'}

Wishlist:
${wList || 'None'}

Return ONLY valid JSON with this structure:
{
  "overall": "<2-3 sentence overall assessment, English + casual Tunisian mix, be specific with numbers>",
  "expenses": {
    "<expense_id>": "<max 12 words: specific tip or warning for this expense. For low-priority items with tight budget, suggest postponing>"
  },
  "wishlist": {
    "<wishlist_id>": "<max 12 words: months to afford or affordability status>"
  }
}

Rules:
- Only include IDs that exist in the input
- For variable low-priority expenses when remaining < 200 TND: suggest postponing to next month
- For wishlist: if savingsCapacity > 0, say "~X months at current savings pace" otherwise "budget too tight this month"
- Be direct and specific, not generic`

  const result = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 800,
  })

  return NextResponse.json(JSON.parse(result.choices[0].message.content || '{}'))
}
