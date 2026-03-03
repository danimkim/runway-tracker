'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { DataPoint } from '@/lib/utils/aggregations'

interface SpendingChartProps {
  data: DataPoint[]
  currency: string
}

function formatAmount(value: number, currency: string) {
  if (currency === 'KRW') return `₩${value.toLocaleString()}`
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`
}

export function SpendingChart({ data, currency }: SpendingChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={v => String(Math.round(v))} />
        <Tooltip
          formatter={(value: number | undefined) => [formatAmount(value ?? 0, currency), 'Spending']}
        />
        <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
