export interface FixedExpense {
  id: string
  name: string
  amount: number
  category: string
}

export interface VariableExpense {
  id: string
  name: string
  amount: number
  category: string
}

export interface WishlistItem {
  id: string
  name: string
  estimatedPrice: number
  priority: 'low' | 'medium' | 'high'
}

export interface BudgetPlan {
  month: string            // YYYY-MM
  income: number
  fixedTotal: number
  variableTotal: number
  safeSpendingLimit: number
  dailyLimit: number
  weeklyLimit: number
  savingsAmount: number
  savingsPct: number
  warnings: string[]
  wishlistTimeline: { name: string; months: number }[]
  advice: string
  status: 'pending' | 'accepted'
}

export interface TrackedExpense {
  id: string
  name: string
  amount: number
  date: string
  category: string
}

export interface AppData {
  name: string
  monthlyIncome: number
  fixedExpenses: FixedExpense[]
  variableExpenses: VariableExpense[]    // set during monthly planning
  wishlist: WishlistItem[]
  currentPlan: BudgetPlan | null
  trackedExpenses: TrackedExpense[]
}
