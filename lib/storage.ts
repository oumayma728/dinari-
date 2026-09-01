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
  const stats = calcStats(data)
  const rawCash = Math.max(0, stats.actualRemaining + stats.challengeReserved)
  const withPending = { ...data, pendingCarryover: rawCash }
  _cache = withPending
  if (typeof window !== 'undefined')
    setTimeout(() => localStorage.setItem(KEY, JSON.stringify(withPending)), 0)
  return withPending
}

export function checkMonthlyReset(data: AppData): AppData {
  const currentMonth = new Date().toISOString().slice(0, 7)
  if (data.lastSafeMonthChecked === currentMonth) return data
  return {
    ...data,
    carryover: data.pendingCarryover ?? data.carryover,
    incomeSources: data.incomeSources.map(s => ({ ...s, received: false })),
    categories: data.categories.map(c =>
      c.type === 'one-time' ? { ...c, activeThisMonth: false } : c
    ),
  }
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

  const currentMonth = new Date().toISOString().slice(0, 7)
  const challengeReserved = data.challenges
    .filter(c => c.active)
    .reduce((s, c) => s + (c.monthlyHistory?.[currentMonth] || 0), 0)

const plannedRemaining = balance - tickedBudget - challengeReserved

  const monthExpenses = data.transactions
    .filter(t => t.type === 'expense' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  const monthIncome = data.transactions
    .filter(t => t.type === 'income' && isThisMonth(t.date))
    .reduce((s, t) => s + t.amount, 0)

  const actualRemaining = balance + monthIncome - monthExpenses - challengeReserved

  return { balance, plannedRemaining, actualRemaining, tickedBudget, challengeReserved, monthExpenses, monthIncome }
}
export function exportData(): string {
  return JSON.stringify(loadData(), null, 2)
}
 
export function importData(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'File does not contain valid Dinari data.' }
    }
    saveData({ ...defaults, ...parsed } as AppData)
    return { ok: true }
  } catch {
    return { ok: false, error: 'Could not read that file as JSON.' }
  }
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
  const unpaidFixed = data.categories
    .filter(c => c.type === 'fixed' && c.activeThisMonth)
    .reduce((sum, c) => sum + Math.max(c.budget - getCategorySpent(data, c.id), 0), 0)
  const raw = stats.actualRemaining - unpaidFixed
  return { safe: Math.max(raw, 0), raw, unpaidFixed, challengeReserved: stats.challengeReserved }
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
