import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { text, categories } = await req.json()

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      {
        role: 'system',
        content: `You extract transaction data from natural language (English, French, or Tunisian dialect).
Return ONLY valid JSON with these exact fields:
{
  "amount": number (in TND),
  "type": "expense" or "income",
  "category": one of the provided categories,
  "description": short clean description
}
Available categories: ${categories.join(', ')}
If income mentioned (salary, received, etc.) set type to "income".
Never return anything except the JSON object.`,
      },
      { role: 'user', content: text },
    ],
    temperature: 0,
    max_tokens: 100,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
