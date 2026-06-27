import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const { name, income, fixedExpenses, variableExpenses, wishlist } = await req.json()

  const fixedTotal = fixedExpenses.reduce((s: number, e: any) => s + e.amount, 0)
  const variableTotal = variableExpenses.reduce((s: number, e: any) => s + e.amount, 0)
  const totalExpenses = fixedTotal + variableTotal

  const prompt = `You are a personal finance advisor for ${name}, based in Tunisia. Currency is TND.

Monthly income: ${income} TND
Fixed expenses (recurring every month):
${fixedExpenses.map((e: any) => `- ${e.name}: ${e.amount} TND`).join('\n') || '- None'}

Variable expenses planned this month:
${variableExpenses.map((e: any) => `- ${e.name}: ${e.amount} TND`).join('\n') || '- None'}

Wishlist items:
${wishlist.map((w: any) => `- ${w.name}: ${w.estimatedPrice} TND`).join('\n') || '- None'}

Generate a realistic monthly budget plan. Return ONLY valid JSON:
{
  "fixedTotal": ${fixedTotal},
  "variableTotal": ${variableTotal},
  "safeSpendingLimit": <income minus fixedTotal minus savingsAmount>,
  "dailyLimit": <safeSpendingLimit / 30, rounded>,
  "weeklyLimit": <safeSpendingLimit / 4, rounded>,
  "savingsAmount": <recommended savings, minimum 10% of income if feasible, else what's left>,
  "savingsPct": <savingsAmount / income * 100, rounded>,
  "warnings": [<array of clear short warnings if budget is tight or unrealistic, empty array if fine>],
  "wishlistTimeline": [<for each wishlist item: {"name": "...", "months": <months needed at savingsAmount per month>}>],
  "advice": "<2-3 sentences, direct and warm, mix English and Tunisian dialect naturally, mention specific numbers>"
}

Rules:
- If totalExpenses > income, savingsAmount = 0 and add a warning
- If income - fixedTotal < 200, add warning about tight budget
- Advice must be specific, not generic. Mention actual numbers from the plan.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 600,
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')
  return NextResponse.json(result)
}
