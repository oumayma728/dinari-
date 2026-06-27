import { AppData } from './types'

const KEY = 'dinari_v3'
let _cache: AppData | null = null

const defaults: AppData = {
  name: 'Oumayma',
  balance: 0,
  nextMonthIncome: 0,
  expenses: [],
  wishlist: [],
  insights: null,
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

// Derived calculations (pure, no side effects)
export function calcTotals(data: AppData) {
  const fixed = data.expenses.filter(e => e.type === 'fixed').reduce((s, e) => s + e.amount, 0)
  const oneTime = data.expenses.filter(e => e.type === 'one-time').reduce((s, e) => s + e.amount, 0)
  const variable = data.expenses.filter(e => e.type === 'variable').reduce((s, e) => s + e.amount, 0)
  const total = fixed + oneTime + variable
  const available = data.balance + data.nextMonthIncome
  const remaining = available - total
  const savingsCapacity = Math.max(0, remaining)
  return { fixed, oneTime, variable, total, available, remaining, savingsCapacity }
}
