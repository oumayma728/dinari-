import { AppData, Transaction, Category, Goal, RecurringTransaction } from './types'

const KEY = 'dinari_data'

// Module-level cache — only one JSON.parse per session
let _cache: AppData | null = null

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
  if (_cache) return _cache
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) { _cache = { ...defaultData }; return _cache }
    const parsed = JSON.parse(raw)
    _cache = { ...defaultData, ...parsed, categories: parsed.categories || defaultCategories, recurring: parsed.recurring || [] } as AppData
    return _cache!
  } catch {
    _cache = { ...defaultData } as AppData
    return _cache
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  _cache = data
  // Defer the write so the UI updates first
  requestIdleCallback
    ? requestIdleCallback(() => localStorage.setItem(KEY, JSON.stringify(data)))
    : setTimeout(() => localStorage.setItem(KEY, JSON.stringify(data)), 0)
}

// All mutations take current data + return updated data (no extra read)
export function addTransaction(data: AppData, tx: Omit<Transaction, 'id' | 'createdAt'>): AppData {
  const newTx: Transaction = { ...tx, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  const updated = { ...data, transactions: [newTx, ...data.transactions] }
  saveData(updated)
  return updated
}

export function deleteTransaction(data: AppData, id: string): AppData {
  const updated = { ...data, transactions: data.transactions.filter(t => t.id !== id) }
  saveData(updated)
  return updated
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthTransactions(data: AppData, month: Date): Transaction[] {
  const m = month.getMonth()
  const y = month.getFullYear()
  return data.transactions.filter(tx => {
    const d = new Date(tx.date)
    return d.getMonth() === m && d.getFullYear() === y
  })
}

export function getMonthStats(txs: Transaction[], month: Date) {
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0
  const today = new Date()
  const isCurrentMonth = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()
  const daysElapsed = isCurrentMonth ? today.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const dailyAvg = daysElapsed > 0 ? expenses / daysElapsed : 0
  return { income, expenses, balance, savingsRate, dailyAvg }
}

export function getCategorySpending(txs: Transaction[]): Record<string, number> {
  const map: Record<string, number> = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    map[t.category] = (map[t.category] || 0) + t.amount
  })
  return map
}

export function getAllTimeBalance(data: AppData): number {
  return data.transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0)
}

export function getLast6MonthsStats(data: AppData) {
  const result = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
    const txs = getMonthTransactions(data, d)
    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    result.push({ month: d.toLocaleDateString('en-US', { month: 'short' }), income: Math.round(income), expenses: Math.round(expenses) })
  }
  return result
}

export function getDailySpending(txs: Transaction[], month: Date) {
  const expenseTxs = txs.filter(t => t.type === 'expense')
  const map: Record<number, number> = {}
  expenseTxs.forEach(t => { const day = new Date(t.date).getDate(); map[day] = (map[day] || 0) + t.amount })
  const today = new Date()
  const isCurrentMonth = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear()
  const maxDay = isCurrentMonth ? today.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const days = []; let running = 0
  for (let d = 1; d <= maxDay; d++) {
    running += map[d] || 0
    days.push({ day: d, amount: Math.round(running * 100) / 100 })
  }
  return days
}

export function getBudgetAlerts(data: AppData, categorySpend: Record<string, number>) {
  return data.categories
    .filter(cat => cat.budgetLimit && cat.budgetLimit > 0)
    .map(cat => ({ category: cat, spent: categorySpend[cat.name] || 0, limit: cat.budgetLimit!, pct: Math.round(((categorySpend[cat.name] || 0) / cat.budgetLimit!) * 100) }))
    .filter(a => a.pct >= 70)
    .sort((a, b) => b.pct - a.pct)
}

export function applyRecurringTransactions(data: AppData, selectedIds: string[]): AppData {
  const currentKey = getMonthKey(new Date())
  const toApply = data.recurring.filter(r => r.active && selectedIds.includes(r.id))
  const newTxs: Transaction[] = toApply.map(r => ({
    id: crypto.randomUUID(), amount: r.amount, type: r.type, category: r.category,
    description: r.description, date: new Date().toISOString().split('T')[0], createdAt: new Date().toISOString(),
  }))
  const updated = { ...data, transactions: [...newTxs, ...data.transactions], lastRecurringCheck: currentKey }
  saveData(updated)
  return updated
}

export function needsRecurringCheck(data: AppData): boolean {
  if (!data.recurring || data.recurring.filter(r => r.active).length === 0) return false
  return data.lastRecurringCheck !== getMonthKey(new Date())
}

export function exportToCSV(data: AppData): string {
  const rows = [['Date', 'Description', 'Category', 'Type', 'Amount (TND)']]
  data.transactions.forEach(t => rows.push([t.date, t.description, t.category, t.type, t.amount.toFixed(3)]))
  return rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
}
