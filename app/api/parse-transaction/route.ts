import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { text, categories } = await req.json()

  const catList = categories.map((c: any) => `${c.id}|${c.name}`).join(', ')

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `Extract a transaction from natural language (English, French, or Tunisian dialect).
Available categories (id|name): ${catList || 'none'}
Return ONLY valid JSON:
{
  "amount": <number in TND>,
  "type": "expense" or "income",
  "description": "<short clean description>",
  "categoryId": "<the matching category id from the list above, pick the closest>",
  "categoryName": "<the matching category name>"
}
If income/salary/received → type income. Otherwise expense.
Never return anything except the JSON.`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0,
    max_tokens: 120,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
