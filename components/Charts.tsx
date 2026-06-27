'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts'

interface CategoryChartProps {
  data: { name: string; icon: string; amount: number; color: string }[]
}

export function CategoryBarChart({ data }: CategoryChartProps) {
  if (!data.length) return null
  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: any) => [`${Number(v).toFixed(0)} TND`, '']}
            contentStyle={{ borderRadius: 10, border: '0.5px solid var(--border)', fontSize: 12, background: 'white' }}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color === '#F5F5F5' ? '#D4A373' : entry.color.replace('E8', 'C0')} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MonthlyChartProps {
  data: { month: string; income: number; expenses: number }[]
}

export function MonthlyBarChart({ data }: MonthlyChartProps) {
  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: any, name: any) => [`${Number(v)} TND`, name]}
            contentStyle={{ borderRadius: 10, border: '0.5px solid var(--border)', fontSize: 12, background: 'white' }}
          />
          <Bar dataKey="income" fill="#A8D5B0" radius={[4, 4, 0, 0]} maxBarSize={16} name="Income" />
          <Bar dataKey="expenses" fill="#F5A898" radius={[4, 4, 0, 0]} maxBarSize={16} name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface DailyChartProps {
  data: { day: number; amount: number }[]
}

export function DailyAreaChart({ data }: DailyChartProps) {
  const today = new Date().getDate()
  const visible = data.filter(d => d.day <= today)
  return (
    <div style={{ width: '100%', height: 100 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={visible} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#D4A373" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#D4A373" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={4} />
          <YAxis hide />
          <Tooltip
            formatter={(v: any) => [`${Number(v).toFixed(0)} TND`, 'Cumulative spend']}
            contentStyle={{ borderRadius: 10, border: '0.5px solid var(--border)', fontSize: 11, background: 'white' }}
          />
          <Area type="monotone" dataKey="amount" stroke="#D4A373" strokeWidth={2} fill="url(#dailyGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
