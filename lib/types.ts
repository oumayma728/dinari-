export type Priority = 'high' | 'medium' | 'low'
export type ExpenseType = 'fixed' | 'one-time' | 'variable'

export interface Expense {
  id: string
  name: string
  amount: number
  type: ExpenseType
  priority: Priority
}

export interface WishlistItem {
  id: string
  name: string
  price: number
  priority: Priority
}

export interface AIInsights {
  overall: string
  expenses: Record<string, string>   // id → short insight
  wishlist: Record<string, string>   // id → short insight
  generatedAt: string
}

export interface AppData {
  name: string
  balance: number
  nextMonthIncome: number
  expenses: Expense[]
  wishlist: WishlistItem[]
  insights: AIInsights | null
}
