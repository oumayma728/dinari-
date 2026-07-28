import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

interface Category {
  id?: string
  name: string
  budget: number
  spent: number
  active: boolean
}

interface Challenge {
  id?: string
  name: string
  target: number
  saved: number
}

interface WishlistItem {
  id?: string
  name: string
  price?: number
  cost?: number
}

interface Transaction {
  id?: string
  description?: string
  label?: string
  amount: number
  date?: string
}

interface IncomeSource {
  name: string
  amount: number
  day: number
  received: boolean
}

interface ChatContext {
  name?: string
  receivedIncome: number
  pendingIncome: number
  carryover: number
  totalBalance: number
  // Safe-to-spend numbers (replaces plannedRemaining/actualRemaining as the
  // source of truth — those two could diverge and neither represented real
  // spendable money once envelopes/bills were accounted for).
  safeToSpend: number
  reservedInEnvelopes: number
  unpaidFixedBills: number
  incomeSources?: IncomeSource[]
  categories?: Category[]
  challenges?: Challenge[]
  wishlist?: WishlistItem[]
  recentTransactions?: Transaction[]
}

interface ChatRequest {
  messages: Groq.Chat.Completions.ChatCompletionMessageParam[]
  context: ChatContext
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context }: ChatRequest = await req.json()

    if (!context) {
      return new Response(
        JSON.stringify({ error: 'Missing financial context.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const activeCategories: Category[] =
      context.categories?.filter((c) => c.active) ?? []

    const totalBudget = activeCategories.reduce(
      (sum, c) => sum + (c.budget || 0),
      0
    )

    const totalSpent = activeCategories.reduce(
      (sum, c) => sum + (c.spent || 0),
      0
    )

    const overspentCategories = activeCategories.filter(
      (c) => (c.spent || 0) > (c.budget || 0)
    )

    const biggestExpense = [...activeCategories].sort(
      (a, b) => (b.spent || 0) - (a.spent || 0)
    )[0]

    const savingsRate =
      context.receivedIncome > 0
        ? (
            (Math.max(0, context.safeToSpend) /
              context.receivedIncome) *
            100
          ).toFixed(1)
        : '0'

    const categoriesSummary = activeCategories.length
      ? activeCategories
          .map(
            (c) =>
              `- ${c.name}: Budget ${c.budget} TND | Spent ${
                c.spent || 0
              } TND | Remaining ${
                (c.budget || 0) - (c.spent || 0)
              } TND`
          )
          .join('\n')
      : 'No active categories this month'

    const overspentSummary =
      overspentCategories.length > 0
        ? overspentCategories
            .map(
              (c) =>
                `${c.name} (+${(c.spent || 0) - (c.budget || 0)} TND)`
            )
            .join(', ')
        : 'None'

    // Precompute affordability math server-side instead of asking the model
    // to do multi-step arithmetic under a tight word limit — small/fast
    // models are unreliable at this and it's a direct source of bad advice.
    const wishlistSummary = context.wishlist?.length
      ? context.wishlist
          .map((w) => {
            const price = w.price ?? w.cost ?? 0
            const monthsNeeded =
              price > 0 && context.safeToSpend > 0
                ? Math.ceil(price / context.safeToSpend)
                : null
            const afford =
              price > 0
                ? price <= context.safeToSpend
                  ? 'affordable right now'
                  : `needs ${(price - context.safeToSpend).toFixed(
                      0
                    )} more TND`
                : ''
            return `- ${w.name}: ${price} TND${
              monthsNeeded
                ? ` (≈${monthsNeeded} month${
                    monthsNeeded > 1 ? 's' : ''
                  } at current safe-to-spend pace, ${afford})`
                : ''
            }`
          })
          .join('\n')
      : 'No wishlist items'

    const challengeSummary =
      context.challenges?.length
        ? context.challenges
            .map(
              (c) =>
                `- ${c.name}: ${c.saved || 0}/${c.target || 0} TND`
            )
            .join('\n')
        : 'No active challenges'

    const incomeSummary = context.incomeSources?.length
      ? context.incomeSources
          .map(
            (s) =>
              `- ${s.name}: ${s.amount} TND, expected day ${s.day}${
                s.received ? ' (already received)' : ' (not yet received)'
              }`
          )
          .join('\n')
      : 'No income sources set'

    const recentTransactions =
      context.recentTransactions
        ?.slice(0, 15)
        .map(
          (t) =>
            `- ${t.description || t.label || 'Transaction'}: ${
              t.amount
            } TND`
        )
        .join('\n') || 'No recent transactions'

    const system = `
You are Dinari, a smart Tunisian personal finance coach.

The user is:
${context.name || 'User'}

Currency:
TND (Tunisian Dinar)

====================
LANGUAGE RULES
====================

- Speak Tunisian Darija naturally.
- Mix Darija + simple French when appropriate.
- Never use formal Arabic.
- Never use Moroccan dialect.
- Sound like a financially smart Tunisian friend.
- Be supportive and practical.

Examples of words:
enti, mte3ek, flous, tawa, bech, najem, ma3andekch, lazmek, chnouwa, barcha, kifeh

====================
YOUR ROLE
====================

You help the user:

1. Control spending
2. Improve savings
3. Reach goals faster
4. Understand money habits
5. Avoid financial mistakes
6. Stay motivated

Always explain WHY.

====================
FINANCIAL REASONING
====================

Before answering:

1. Check "Safe to spend right now" first — this is the ONLY number that represents money 
   the user can actually touch. It already excludes money reserved in envelopes/challenges 
   and unpaid fixed bills.
2. Check overspending
3. Check savings rate
4. Check wishlist affordability (already calculated for you below — do not recompute or 
   estimate different numbers, use the figures given)
5. Check challenges progress
6. Consider pending income

Important:

- Never assume pending income is guaranteed. Only treat income marked "already received" as real.
- Never recommend spending money the user does not currently have safe-to-spend.
- Never recommend spending money that is reserved inside an envelope/challenge — that money 
  is not available even though it sits in the same bank account.
- Warn politely when cash flow is risky.
- Celebrate positive progress.
- Use the precomputed numbers given to you (affordability, months needed, savings rate) — 
  do not attempt your own multi-step math, just relay and explain the figures provided.

====================
CURRENT FINANCIAL SNAPSHOT
====================

Income received:
${context.receivedIncome} TND

Pending income (not yet received):
${context.pendingIncome} TND

Carryover from last month:
${context.carryover} TND

Total balance (bank account):
${context.totalBalance} TND

Safe to spend right now:
${context.safeToSpend} TND

(This already excludes ${context.reservedInEnvelopes} TND reserved in savings envelopes 
and ${context.unpaidFixedBills} TND in unpaid fixed bills — treat this, not total balance, 
as the real spendable amount.)

====================
INSIGHTS
====================

Total budget:
${totalBudget} TND

Total spent:
${totalSpent} TND

Savings rate (based on safe-to-spend):
${savingsRate}%

Biggest expense:
${biggestExpense?.name || 'None'}

Overspent categories:
${overspentSummary}

====================
INCOME SOURCES
====================

${incomeSummary}

====================
ACTIVE CATEGORIES
====================

${categoriesSummary}

====================
SAVING CHALLENGES / ENVELOPES
====================

${challengeSummary}

====================
WISHLIST
====================

${wishlistSummary}

====================
RECENT TRANSACTIONS
====================

${recentTransactions}

====================
RESPONSE FORMAT
====================

For recommendations:

📊 Situation
(short analysis)

💡 Recommendation
(specific action with TND amounts)

🎯 Impact
(expected result)

Keep answers under 150 words unless the user asks for details.

If savings rate is below 10%, suggest improvements.

If overspending exists, identify exactly where cuts can be made.

If a wishlist item is mentioned, use the affordability and months-needed figures already 
calculated above — do not estimate your own.

If safe-to-spend is negative or very low:
provide a recovery plan.

If the user is doing well:
acknowledge and encourage them.
`

    // Cap conversation history sent to the model — an unbounded spread here
    // means cost and latency grow with every message in a long chat session.
    const recentMessages = messages.slice(-12)

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: system,
        },
        ...recentMessages,
      ],
      temperature: 0.5,
      max_tokens: 700,
      stream: true,
    })

    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices?.[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(text))
            }
          }
        } catch (streamErr) {
          console.error('Dinari AI stream error:', streamErr)
          controller.enqueue(
            encoder.encode(
              '\n\n[Something went wrong while replying — try again.]'
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (err) {
    console.error('Dinari AI route error:', err)
    return new Response(
      JSON.stringify({
        error: 'Failed to get a response from the assistant. Try again in a moment.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}