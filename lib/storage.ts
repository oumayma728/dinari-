import { AppData, IncomeSource } from './types'

const KEY = 'dinari_v4'
let _cache: AppData | null = null

const defaults: AppData = {
  name: 'Oumayma',
  incomeSources: [],
  carryover: 0,
  categories: [],
  transactions: [],
  challenges: [],
  wishlistGroups: [],
  streak: 0,
  safeStreak: 0,
}

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaults
  if (_cache) return _cache
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) { _cache = { ...defaults }; return _cache }
    const parsed = JSON.parse(raw)
    // Migration: old data had a single salary field
    if (parsed.salary != null && !parsed.incomeSources) {
      parsed.incomeSources = parsed.salary > 0
        ? [{ id: 'migrated-salary', name: 'Salary', amount: parsed.salary, day: 1, received: true }]
        : []
    }
    _cache = { ...defaults, ...parsed } as AppData
    return _cache
  } catch {
    _cache = { ...defaults }
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
  const receivedIncome = data.incomeSources
    .filter(s => s.received)
    .reduce((s, inc) => s + inc.amount, 0)

  const balance = receivedIncome + (data.carryover || 0)

  const tickedBudget = data.categories
    .filter(c => c.activeThisMonth)
    .reduce((s, c) => s + c.budget, 0)

  const challengeReserved = data.challenges
    .filter(c => c.active)
    .reduce((s, c) => s + c.savedAmount, 0)

const plannedRemaining = balance - tickedBudget

  const monthExpenses = data.transactions
    .filter(t => t.type === 'expense' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  const monthIncome = data.transactions
    .filter(t => t.type === 'income' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  const actualRemaining = balance + monthIncome - monthExpenses

  return { balance, plannedRemaining, actualRemaining, tickedBudget, challengeReserved, monthExpenses, monthIncome }
}

export function getUpcomingIncome(data: AppData): IncomeSource[] {
  return data.incomeSources
    .filter(s => !s.received)
    .sort((a, b) => a.day - b.day)
}

export function getCategorySpent(data: AppData, categoryId: string): number {
  return data.transactions
    .filter(t => t.categoryId === categoryId && t.type === 'expense' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)
}

export function getSafeToSpend(data: AppData) {
  const stats = calcStats(data)
  const essentialReserved = data.challenges
    .filter(c => c.active && c.isEssential)
    .reduce((s, c) => s + c.savedAmount, 0)
  const unpaidFixed = data.categories
    .filter(c => c.type === 'fixed' && c.activeThisMonth)
    .reduce((sum, c) => sum + Math.max(c.budget - getCategorySpent(data, c.id), 0), 0)
  const raw = stats.actualRemaining - essentialReserved - unpaidFixed
  return { safe: Math.max(raw, 0), raw, unpaidFixed, challengeReserved: essentialReserved }
}

export function canAfford(data: AppData, amount: number) {
  const { safe } = getSafeToSpend(data)
  const after = safe - amount
  return { affordable: after >= 0, after, tight: after >= 0 && safe > 0 && after < safe * 0.15 }
}

export function updateStreak(data: AppData): AppData {
  const today = new Date().toISOString().slice(0, 10)
  if (data.lastTrackedDate === today) return data
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const streak = data.lastTrackedDate === yesterday ? (data.streak || 0) + 1 : 1
  return { ...data, streak, lastTrackedDate: today }
}

export function updateSafeStreak(data: AppData): AppData {
  const currentMonth = new Date().toISOString().slice(0, 7)
  if (data.lastSafeMonthChecked === currentMonth) return data
  const { raw } = getSafeToSpend(data)
  const safeStreak = raw >= 0 ? (data.safeStreak || 0) + 1 : 0
  return { ...data, safeStreak, lastSafeMonthChecked: currentMonth }
}
