import { AppData, FixedExpense, VariableExpense, WishlistItem, BudgetPlan, TrackedExpense } from './types'

const KEY = 'dinari_v2'
let _cache: AppData | null = null

const defaults: AppData = {
  name: 'Oumayma',
  monthlyIncome: 0,
  fixedExpenses: [],
  variableExpenses: [],
  wishlist: [],
  currentPlan: null,
  trackedExpenses: [],
}

export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaults
  if (_cache) return _cache
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) { _cache = { ...defaults }; return _cache }
    const p = JSON.parse(raw)
    _cache = { ...defaults, ...p } as AppData
    // If plan is from a previous month, clear it + tracked expenses
    if (_cache.currentPlan && _cache.currentPlan.month !== monthKey()) {
      _cache = {
        ..._cache,
        currentPlan: null,
        trackedExpenses: [],
        variableExpenses: [],  // reset variable, suggest from previous via UI
      }
      save(_cache)
    }
    return _cache
  } catch {
    _cache = { ...defaults } as AppData
    return _cache
  }
}

function save(data: AppData) {
  _cache = data
  setTimeout(() => localStorage.setItem(KEY, JSON.stringify(data)), 0)
}

export function saveData(data: AppData): AppData {
  save(data)
  return data
}

export function getTrackedTotal(data: AppData) {
  return data.trackedExpenses.reduce((s, t) => s + t.amount, 0)
}

export function addTrackedExpense(data: AppData, exp: Omit<TrackedExpense, 'id' | 'date'>): AppData {
  const t: TrackedExpense = { ...exp, id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0] }
  return saveData({ ...data, trackedExpenses: [t, ...data.trackedExpenses] })
}

export function removeTrackedExpense(data: AppData, id: string): AppData {
  return saveData({ ...data, trackedExpenses: data.trackedExpenses.filter(t => t.id !== id) })
}
