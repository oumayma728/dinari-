import { AppData } from './types'

const KEY = 'dinari_v4'
let _cache: AppData | null = null

const defaults: AppData = {
  name: 'Oumayma',
  salary: 0,
  balance: 0,
  categories: [],
  transactions: [],
  challenges: [],
  wishlistGroups: [],
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaults
  if (_cache) return _cache
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) { _cache = { ...defaults }; return _cache }
    _cache = { ...defaults, ...JSON.parse(raw) } as AppData
    return _cache
  } catch {
    _cache = { ...defaults } as AppData
    return _cache
  }
}

export function saveData(data: AppData): AppData {
  _cache = data
  if (typeof window !== 'undefined')
    setTimeout(() => localStorage.setItem(KEY, JSON.stringify(data)), 0)
  return data
}

export function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

export function calcStats(data: AppData) {
  const tickedBudget = data.categories
    .filter(c => c.activeThisMonth)
    .reduce((s, c) => s + c.budget, 0)

  const challengeReserved = data.challenges
    .filter(c => c.active)
    .reduce((s, c) => s + c.targetAmount, 0)

  const plannedRemaining = data.salary - tickedBudget - challengeReserved

  const monthExpenses = data.transactions
    .filter(t => t.type === 'expense' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  const monthIncome = data.transactions
    .filter(t => t.type === 'income' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  const actualRemaining = data.balance + monthIncome - monthExpenses

  return { plannedRemaining, actualRemaining, tickedBudget, challengeReserved, monthExpenses, monthIncome }
}

export function getCategorySpent(data: AppData, categoryId: string): number {
  return data.transactions
    .filter(t => t.categoryId === categoryId && t.type === 'expense' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)
}
