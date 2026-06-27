import { AppData, Transaction, Category, Goal, WishlistItem, RecurringTransaction } from './types'

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
  recurring: [],
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaultData }
    const parsed = JSON.parse(raw)
    return { ...defaultData, ...parsed, categories: parsed.categories || defaultCategories, recurring: parsed.recurring || [] }
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
  const newTx: Transaction = { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  data.transactions = [newTx, ...data.transactions]
  saveData(data)
  return newTx
}

export function deleteTransaction(id: string): void {
  const data = loadData()
  data.transactions = data.transactions.filter(t => t.id !== id)
  saveData(data)
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthTransactions(data: AppData, month?: Date): Transaction[] {
  const target = month || new Date()
  return data.transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear()
  })
}

export function getMonthStats(data: AppData, month?: Date) {
  const txs = getMonthTransactions(data, month)
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0
  const today = new Date()
  const isCurrentMonth = !month || (month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear())
  const daysElapsed = isCurrentMonth ? today.getDate() : new Date(target(month).getFullYear(), target(month).getMonth() + 1, 0).getDate()
  const dailyAvg = daysElapsed > 0 ? expenses / daysElapsed : 0
  return { income, expenses, balance, savingsRate, dailyAvg, txs }
}

function target(m?: Date) { return m || new Date() }

export function getLastMonthStats(data: AppData) {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return getMonthStats(data, d)
}

export function getAllTimeBalance(data: AppData): number {
  return data.transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0)
}

export function getCategorySpending(data: AppData, month?: Date) {
  const txs = getMonthTransactions(data, month).filter(t => t.type === 'expense')
  const map: Record<string, number> = {}
  txs.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount })
  return map
}

export function getLast6MonthsStats(data: AppData) {
  const result = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const { income, expenses } = getMonthStats(data, d)
    result.push({
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      income: Math.round(income),
      expenses: Math.round(expenses),
    })
  }
  return result
}

export function getDailySpending(data: AppData, month?: Date) {
  const target = month || new Date()
  const txs = getMonthTransactions(data, target).filter(t => t.type === 'expense')
  const map: Record<number, number> = {}
  txs.forEach(t => {
    const day = new Date(t.date).getDate()
    map[day] = (map[day] || 0) + t.amount
  })
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const days = []
  let running = 0
  for (let d = 1; d <= daysInMonth; d++) {
    running += map[d] || 0
    days.push({ day: d, amount: Math.round(running * 100) / 100 })
  }
  return days
}

export function getBudgetAlerts(data: AppData, month?: Date) {
  const spending = getCategorySpending(data, month)
  const alerts: { category: Category; spent: number; limit: number; pct: number }[] = []
  data.categories.forEach(cat => {
    if (cat.budgetLimit && cat.budgetLimit > 0) {
      const spent = spending[cat.name] || 0
      const pct = Math.round((spent / cat.budgetLimit) * 100)
      if (pct >= 70) alerts.push({ category: cat, spent, limit: cat.budgetLimit, pct })
    }
  })
  return alerts.sort((a, b) => b.pct - a.pct)
}

export function applyRecurringTransactions(data: AppData, selectedIds: string[]): AppData {
  const currentKey = getMonthKey(new Date())
  const toApply = data.recurring.filter(r => r.active && selectedIds.includes(r.id))
  const newTxs: Transaction[] = toApply.map(r => ({
    id: crypto.randomUUID(),
    amount: r.amount,
    type: r.type,
    category: r.category,
    description: r.description,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  }))
  return {
    ...data,
    transactions: [...newTxs, ...data.transactions],
    lastRecurringCheck: currentKey,
  }
}

export function needsRecurringCheck(data: AppData): boolean {
  if (!data.recurring || data.recurring.filter(r => r.active).length === 0) return false
  const currentKey = getMonthKey(new Date())
  return data.lastRecurringCheck !== currentKey
}

export function exportToCSV(data: AppData): string {
  const rows = [['Date', 'Description', 'Category', 'Type', 'Amount (TND)']]
  data.transactions.forEach(t => {
    rows.push([t.date, t.description, t.category, t.type, t.amount.toFixed(3)])
  })
  return rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
}
