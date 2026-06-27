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
  targetAmount: number
  savedAmount: number
  active: boolean
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
  salary: number
  carryover: number       // extra leftover from last month
  categories: Category[]
  transactions: Transaction[]
  challenges: Challenge[]
  wishlistGroups: WishlistGroup[]
}
