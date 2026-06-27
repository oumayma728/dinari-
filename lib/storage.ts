import { AppData, Transaction, Category, Goal, WishlistItem } from './types'

const KEY = 'dinari_data'

const defaultCategories: Category[] = [
  { id: 'food', name: 'Food', icon: '🥗', color: '#FEF3E8' },
  { id: 'transport', name: 'Transport', icon: '🚌', color: '#E8F0FE' },
  { id: 'groceries', name: 'Groceries', icon: '🛒', color: '#F0F4EE' },
  { id: 'shopping', name: 'Shopping', icon: '🛍', color: '#FDF6E8' },
  { id: 'health', name: 'Health', icon: '💊', color: '#FEE8E8' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#EDE8FE' },
  { id: 'bills', name: 'Bills', icon: '💡', color: '#E8F5ED' },
  { id: 'salary', name: 'Salary', icon: '💰', color: '#E8F5ED' },
  { id: 'other', name: 'Other', icon: '📦', color: '#F5F5F5' },
]

const defaultData: AppData = {
  name: 'Oumayma',
  monthlyIncome: 0,
  categories: defaultCategories,
  transactions: [],
  goals: [],
  wishlist: [],
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaultData }
    const parsed = JSON.parse(raw)
    return { ...defaultData, ...parsed }
  } catch {
    return { ...defaultData }
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function addTransaction(tx: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const data = loadData()
  const newTx: Transaction = {
    ...tx,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  data.transactions = [newTx, ...data.transactions]
  saveData(data)
  return newTx
}

export function deleteTransaction(id: string): void {
  const data = loadData()
  data.transactions = data.transactions.filter(t => t.id !== id)
  saveData(data)
}

export function getMonthTransactions(data: AppData, month?: Date): Transaction[] {
  const target = month || new Date()
  return data.transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear()
  })
}

export function getMonthStats(data: AppData) {
  const txs = getMonthTransactions(data)
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses
  return { income, expenses, balance, txs }
}

export function getCategorySpending(data: AppData) {
  const txs = getMonthTransactions(data).filter(t => t.type === 'expense')
  const map: Record<string, number> = {}
  txs.forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount
  })
  return map
}
