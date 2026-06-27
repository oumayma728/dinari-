'use client'
import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2, Plus } from 'lucide-react'
import { loadData, saveData, addTrackedExpense, removeTrackedExpense, getTrackedTotal, monthKey } from '@/lib/storage'
import { AppData, BudgetPlan, VariableExpense } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import { format } from 'date-fns'

type Stage = 'welcome' | 'income' | 'fixed' | 'variable' | 'generating' | 'review' | 'tracking'

export default function PlanPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [stage, setStage] = useState<Stage>('welcome')
  const [income, setIncome] = useState('')
  const [variables, setVariables] = useState<VariableExpense[]>([])
  const [newName, setNewName] = useState('')
  const [newAmt, setNewAmt] = useState('')
  const [newCat, setNewCat] = useState('Other')
  const [plan, setPlan] = useState<BudgetPlan | null>(null)
  const [logName, setLogName] = useState('')
  const [logAmt, setLogAmt] = useState('')
  const [logCat, setLogCat] = useState('Other')
  const [showLog, setShowLog] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const d = loadData()
    setData(d)
    setIncome(d.monthlyIncome ? String(d.monthlyIncome) : '')
    setVariables(d.variableExpenses || [])
    if (d.currentPlan?.status === 'accepted') setStage('tracking')
    else setStage('welcome')
  }, [])

  const refresh = (d: AppData) => { setData({ ...d }) }

  if (!data) return null

  const monthLabel = format(new Date(), 'MMMM yyyy')
  const cats = [...new Set(data.fixedExpenses.map(e => e.category)), 'Food', 'Transport', 'Bills', 'Entertainment', 'Health', 'Other']

  // ── GENERATE PLAN ─────────────────────────────────────────────────────────
  const generate = async () => {
    setError('')
    setStage('generating')
    const inc = parseFloat(income) || 0
    const updated = saveData({ ...data, monthlyIncome: inc, variableExpenses: variables })
    refresh(updated)
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, income: inc, fixedExpenses: data.fixedExpenses, variableExpenses: variables, wishlist: data.wishlist }),
      })
      const p = await res.json()
      const newPlan: BudgetPlan = { ...p, month: monthKey(), income: inc, status: 'pending' }
      setPlan(newPlan)
      setStage('review')
    } catch {
      setError('Could not generate plan. Check your connection.')
      setStage('variable')
    }
  }

  const acceptPlan = () => {
    if (!plan) return
    const accepted = { ...plan, status: 'accepted' as const }
    const updated = saveData({ ...data, currentPlan: accepted, variableExpenses: variables })
    refresh(updated)
    setStage('tracking')
  }

  const rejectPlan = () => { setPlan(null); setStage('variable') }

  const resetPlan = () => {
    const updated = saveData({ ...data, currentPlan: null, trackedExpenses: [], variableExpenses: [] })
    refresh(updated)
    setVariables([])
    setStage('welcome')
  }

  const logExpense = () => {
    if (!logName.trim() || !logAmt) return
    const updated = addTrackedExpense(data, { name: logName.trim(), amount: parseFloat(logAmt), category: logCat })
    refresh(updated)
    setLogName(''); setLogAmt(''); setShowLog(false)
  }

  const addVariable = () => {
    if (!newName.trim() || !newAmt) return
    setVariables(v => [...v, { id: crypto.randomUUID(), name: newName.trim(), amount: parseFloat(newAmt), category: newCat }])
    setNewName(''); setNewAmt('')
  }

  const pt = { padding: 'calc(28px + env(safe-area-inset-top)) 24px 0' }

  // ══════════════════════════════════════════════════════════════════════════
  // WELCOME
  if (stage === 'welcome') return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ ...pt, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 120 }}>
          <p style={{ fontSize: 13, color: 'var(--pink)', fontWeight: 600, margin: '0 0 8px', letterSpacing: '0.3px' }}>{monthLabel}</p>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-1px', lineHeight: 1.15 }}>
            Ready to plan<br />your month?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 48px', lineHeight: 1.6 }}>
            Enter your income and expenses. I'll build a realistic budget and tell you exactly what to do with your money.
          </p>
          <button className="btn-primary" style={{ background: 'var(--pink)' }} onClick={() => setStage('income')}>
            Start planning →
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // INCOME
  if (stage === 'income') return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ ...pt }}>
        <Step current={1} total={3} />
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.6px' }}>What's your income?</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 32px' }}>Salary, freelance, any money coming in this month.</p>
        <p className="label" style={{ margin: '0 0 8px' }}>Monthly income</p>
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--pink-faint)', borderRadius: 14, padding: '14px 16px', marginBottom: 32 }}>
          <input
            type="number" inputMode="decimal" value={income} onChange={e => setIncome(e.target.value)}
            placeholder="0" autoFocus
            style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', color: 'var(--text)' }}
          />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-muted)' }}>TND</span>
        </div>
        <button className="btn-primary" style={{ background: parseFloat(income) > 0 ? 'var(--pink)' : 'var(--text-faint)', marginBottom: 12 }}
          onClick={() => parseFloat(income) > 0 && setStage('fixed')} disabled={!(parseFloat(income) > 0)}>
          Next →
        </button>
      </div>
      <BottomNav />
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // FIXED EXPENSES
  if (stage === 'fixed') return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ ...pt }}>
        <Step current={2} total={3} />
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.6px' }}>Fixed expenses</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>
          These auto-load every month. Edit them in Expenses tab.
        </p>
        {data.fixedExpenses.length === 0 ? (
          <div style={{ background: 'var(--pink-faint)', borderRadius: 16, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>No fixed expenses yet.<br />Add them in the Expenses tab.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 24 }}>
            {data.fixedExpenses.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{e.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', fontWeight: 500 }}>{e.category}</p>
                </div>
                <p className="num" style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--pink)' }}>{e.amount} TND</p>
              </div>
            ))}
            <div style={{ padding: '12px 18px', borderTop: '0.5px solid var(--border)', background: 'var(--pink-faint)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)' }}>Total fixed</span>
                <span className="num" style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)' }}>
                  {data.fixedExpenses.reduce((s, e) => s + e.amount, 0).toFixed(0)} TND
                </span>
              </div>
            </div>
          </div>
        )}
        <button className="btn-primary" style={{ background: 'var(--pink)', marginBottom: 12 }} onClick={() => setStage('variable')}>
          Next →
        </button>
        <button className="btn-ghost" onClick={() => setStage('income')}>← Back</button>
      </div>
      <BottomNav />
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // VARIABLE EXPENSES
  if (stage === 'variable') return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ ...pt }}>
        <Step current={3} total={3} />
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.6px' }}>Other expenses</h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>
          Planned spending this month — groceries, outings, subscriptions, etc.
        </p>

        {variables.length > 0 && (
          <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 16 }}>
            {variables.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{v.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '1px 0 0', fontWeight: 500 }}>{v.category}</p>
                </div>
                <p className="num" style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{v.amount} TND</p>
                <button onClick={() => setVariables(vs => vs.filter(x => x.id !== v.id))} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                  <Trash2 size={14} color="var(--text-faint)" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add variable */}
        <div style={{ background: 'white', borderRadius: 18, padding: '16px', boxShadow: 'var(--shadow)', marginBottom: 24 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Expense name"
            style={{ width: '100%', border: 'none', outline: 'none', background: 'var(--pink-faint)', borderRadius: 11, padding: '11px 14px', fontSize: 14, marginBottom: 10 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input type="number" value={newAmt} onChange={e => setNewAmt(e.target.value)} placeholder="Amount"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'var(--pink-faint)', borderRadius: 11, padding: '11px 14px', fontSize: 14 }} />
            <select value={newCat} onChange={e => setNewCat(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'var(--pink-faint)', borderRadius: 11, padding: '11px 14px', fontSize: 14, color: 'var(--text)' }}>
              {['Food', 'Transport', 'Bills', 'Entertainment', 'Health', 'Shopping', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={addVariable} disabled={!newName.trim() || !newAmt}
            style={{ width: '100%', padding: '11px', borderRadius: 11, border: 'none', background: newName.trim() && newAmt ? 'var(--pink-light)' : 'var(--border)', color: newName.trim() && newAmt ? 'var(--pink)' : 'var(--text-faint)', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={15} /> Add expense
          </button>
        </div>

        {error && <p style={{ color: 'var(--pink)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>{error}</p>}

        <button className="btn-primary" style={{ background: 'var(--pink)', marginBottom: 12 }} onClick={generate}>
          Generate my budget plan →
        </button>
        <button className="btn-ghost" onClick={() => setStage('fixed')}>← Back</button>
      </div>
      <BottomNav />
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // GENERATING
  if (stage === 'generating') return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={36} color="var(--pink)" style={{ animation: 'spin 0.9s linear infinite', marginBottom: 20 }} />
      <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px', letterSpacing: '-0.3px' }}>Building your plan…</p>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>AI is crunching your numbers</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // REVIEW
  if (stage === 'review' && plan) {
    const inc = parseFloat(income)
    const leftover = inc - plan.fixedTotal - plan.variableTotal - plan.savingsAmount
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        <div style={{ ...pt }}>
          <p style={{ fontSize: 13, color: 'var(--pink)', fontWeight: 600, margin: '0 0 4px' }}>Your plan for {monthLabel}</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px', letterSpacing: '-0.6px' }}>Here's what I recommend</h2>

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <div style={{ background: 'var(--warning-bg)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
              {plan.warnings.map((w, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < plan.warnings.length - 1 ? 8 : 0 }}>
                  <AlertTriangle size={15} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: 'var(--warning)', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Numbers */}
          <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 16 }}>
            {[
              { label: 'Monthly income', val: `${inc.toFixed(0)} TND`, accent: false },
              { label: 'Fixed expenses', val: `− ${plan.fixedTotal.toFixed(0)} TND`, accent: false },
              { label: 'Planned expenses', val: `− ${plan.variableTotal.toFixed(0)} TND`, accent: false },
              { label: 'Savings', val: `− ${plan.savingsAmount.toFixed(0)} TND (${plan.savingsPct}%)`, accent: false },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 18px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>{row.label}</span>
                <span className="num" style={{ fontSize: 14, fontWeight: 600 }}>{row.val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1.5px solid var(--pink-light)', background: 'var(--pink-faint)' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--pink)' }}>Safe to spend</span>
              <span className="num" style={{ fontSize: 16, fontWeight: 700, color: 'var(--pink)' }}>{plan.safeSpendingLimit.toFixed(0)} TND</span>
            </div>
          </div>

          {/* Daily / weekly */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '16px', boxShadow: 'var(--shadow)' }}>
              <p className="label" style={{ margin: '0 0 6px' }}>Daily limit</p>
              <p className="num" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.8px' }}>{plan.dailyLimit.toFixed(0)}</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '2px 0 0', fontWeight: 500 }}>TND/day</p>
            </div>
            <div style={{ background: 'white', borderRadius: 16, padding: '16px', boxShadow: 'var(--shadow)' }}>
              <p className="label" style={{ margin: '0 0 6px' }}>Weekly limit</p>
              <p className="num" style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: '-0.8px' }}>{plan.weeklyLimit.toFixed(0)}</p>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '2px 0 0', fontWeight: 500 }}>TND/week</p>
            </div>
          </div>

          {/* Wishlist timeline */}
          {plan.wishlistTimeline.length > 0 && (
            <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, padding: '14px 18px 10px', margin: 0 }}>Wishlist timeline</p>
              {plan.wishlistTimeline.map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 18px', borderTop: '0.5px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{w.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: w.months <= 3 ? 'var(--success)' : w.months <= 6 ? 'var(--warning)' : 'var(--text-muted)' }}>
                    {w.months <= 0 ? 'This month!' : `${w.months} month${w.months > 1 ? 's' : ''}`}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AI advice */}
          <div style={{ background: 'var(--pink-faint)', borderRadius: 16, padding: '16px', marginBottom: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--pink)', margin: '0 0 6px' }}>Dinari says</p>
            <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{plan.advice}</p>
          </div>

          {/* Accept / modify / reject */}
          <button className="btn-primary" style={{ background: 'var(--pink)', marginBottom: 10 }} onClick={acceptPlan}>
            ✓ Accept this plan
          </button>
          <button className="btn-ghost" style={{ marginBottom: 10 }} onClick={rejectPlan}>
            ↺ Modify expenses
          </button>
          <button onClick={() => { setPlan(null); setStage('income') }}
            style={{ width: '100%', padding: '12px', border: 'none', background: 'none', color: 'var(--text-faint)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
            Start over
          </button>
        </div>
        <div className="safe-b" />
        <BottomNav />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TRACKING
  if (stage === 'tracking' && (data.currentPlan || plan)) {
    const activePlan = data.currentPlan!
    const spent = getTrackedTotal(data)
    const remaining = activePlan.safeSpendingLimit - spent
    const pct = Math.min(100, Math.round((spent / activePlan.safeSpendingLimit) * 100))
    const isOver = remaining < 0
    const barColor = pct >= 90 ? 'var(--pink)' : pct >= 70 ? 'var(--warning)' : 'var(--success)'

    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        <div style={{ ...pt }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--pink)', fontWeight: 600, margin: '0 0 3px', letterSpacing: '0.3px' }}>{monthLabel}</p>
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.7px' }}>Tracking</h1>
            </div>
            <button onClick={resetPlan} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}>
              New month
            </button>
          </div>

          {/* Main remaining */}
          <div style={{ marginBottom: 28 }}>
            <p className="label" style={{ margin: '0 0 6px' }}>Safe to spend</p>
            <p className="num" style={{ fontSize: 44, fontWeight: 700, margin: '0 0 16px', letterSpacing: '-1.5px', lineHeight: 1, color: isOver ? 'var(--pink)' : 'var(--text)' }}>
              {remaining.toFixed(0)}<span style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 6 }}>TND</span>
            </p>
            {isOver && <p style={{ fontSize: 13, color: 'var(--pink)', fontWeight: 600, marginBottom: 12 }}>⚠️ Over budget by {Math.abs(remaining).toFixed(0)} TND</p>}

            {/* Progress bar */}
            <div style={{ background: 'rgba(26,22,20,0.07)', borderRadius: 99, height: 8, marginBottom: 8 }}>
              <div style={{ background: barColor, borderRadius: 99, height: 8, width: `${pct}%`, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Spent {spent.toFixed(0)} TND</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{pct}% used</span>
            </div>
          </div>

          {/* Daily / weekly from plan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '14px', boxShadow: 'var(--shadow)' }}>
              <p className="label" style={{ margin: '0 0 4px' }}>Daily limit</p>
              <p className="num" style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.6px' }}>{activePlan.dailyLimit.toFixed(0)}</p>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0', fontWeight: 500 }}>TND/day</p>
            </div>
            <div style={{ background: 'white', borderRadius: 16, padding: '14px', boxShadow: 'var(--shadow)' }}>
              <p className="label" style={{ margin: '0 0 4px' }}>Weekly limit</p>
              <p className="num" style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.6px' }}>{activePlan.weeklyLimit.toFixed(0)}</p>
              <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0', fontWeight: 500 }}>TND/week</p>
            </div>
          </div>

          {/* Log expense */}
          {showLog ? (
            <div style={{ background: 'white', borderRadius: 18, padding: '16px', boxShadow: 'var(--shadow)', marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.2px' }}>Log an expense</p>
              <input value={logName} onChange={e => setLogName(e.target.value)} placeholder="What did you spend on?"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 11, border: 'none', background: 'var(--pink-faint)', fontSize: 14, marginBottom: 10, outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input type="number" value={logAmt} onChange={e => setLogAmt(e.target.value)} placeholder="Amount (TND)"
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 11, border: 'none', background: 'var(--pink-faint)', fontSize: 14, outline: 'none' }} />
                <select value={logCat} onChange={e => setLogCat(e.target.value)}
                  style={{ flex: 1, padding: '11px 14px', borderRadius: 11, border: 'none', background: 'var(--pink-faint)', fontSize: 14, color: 'var(--text)', outline: 'none' }}>
                  {['Food', 'Transport', 'Bills', 'Entertainment', 'Health', 'Shopping', 'Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowLog(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button onClick={logExpense} className="btn-primary" style={{ flex: 2, background: 'var(--pink)' }}>Save</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowLog(true)} className="btn-primary" style={{ background: 'var(--pink)', marginBottom: 20 }}>
              + Log expense
            </button>
          )}

          {/* Expense history */}
          {data.trackedExpenses.length > 0 && (
            <>
              <p className="label" style={{ margin: '0 0 10px' }}>This month</p>
              <div style={{ background: 'white', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                {data.trackedExpenses.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderTop: i > 0 ? '0.5px solid var(--border)' : 'none' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0', fontWeight: 500 }}>{t.category} · {format(new Date(t.date), 'dd MMM')}</p>
                    </div>
                    <p className="num" style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--pink)' }}>−{t.amount.toFixed(0)}</p>
                    <button onClick={() => refresh(removeTrackedExpense(data, t.id))} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                      <Trash2 size={14} color="var(--text-faint)" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="safe-b" />
        <BottomNav />
      </div>
    )
  }

  return null
}

function Step({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i < current ? 'var(--pink)' : 'rgba(26,22,20,0.1)', transition: 'background 0.3s' }} />
      ))}
    </div>
  )
}
