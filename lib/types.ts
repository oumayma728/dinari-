export type CategoryType = 'fixed' | 'variable' | 'one-time'

export interface Category {
  id: string
  name: string
  icon: string
  type: CategoryType
  budget: number
  priority: number        // 1 = highest
  activeThisMonth: boolean
}

export interface IncomeSource {
  id: string
  name: string       // e.g. "Salary", "CIVP"
  amount: number
  day: number        // expected day of month, 1-31
  received: boolean  // true once it's actually landed this month
}

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string            // YYYY-MM-DD
  description: string
  categoryId: string
  createdAt: string
}

export interface Challenge {
  id: string
  name: string
  icon?: string
  targetAmount: number
  savedAmount: number
  active: boolean
  deadline?: string            // YYYY-MM
  isEssential?: boolean        // counted toward safe-to-spend reserve
  monthlyContribution?: number // suggested amount to stuff per month
}

export interface WishlistItem {
  id: string
  name: string
  price?: number
  bought: boolean
}

export interface WishlistGroup {
  id: string
  title: string
  items: WishlistItem[]
}

export interface AppData {
  name: string
  incomeSources: IncomeSource[]
  carryover: number
  categories: Category[]
  transactions: Transaction[]
  challenges: Challenge[]
  wishlistGroups: WishlistGroup[]
  streak: number
  lastTrackedDate?: string      // YYYY-MM-DD
  safeStreak: number
  lastSafeMonthChecked?: string // YYYY-MM
  themeColor?: string
}
