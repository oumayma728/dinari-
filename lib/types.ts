export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  description: string
  date: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  savedAmount: number
  icon: string
  deadline?: string
}

export interface WishlistItem {
  id: string
  name: string
  estimatedPrice: number
  priority: 'low' | 'medium' | 'high'
  notes?: string
  bought: boolean
  createdAt: string
}

export interface AppData {
  name: string
  monthlyIncome: number
  categories: Category[]
  transactions: Transaction[]
  goals: Goal[]
  wishlist: WishlistItem[]
}
