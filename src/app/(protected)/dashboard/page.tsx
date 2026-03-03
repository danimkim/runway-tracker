'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SpendingChart } from '@/components/charts/SpendingChart'
import { groupByDay, groupByWeek, groupByMonth } from '@/lib/utils/aggregations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Period = 'daily' | 'weekly' | 'monthly'
type Currency = 'KRW' | 'GBP' | 'EUR'

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('monthly')
  const [currency, setCurrency] = useState<Currency>('GBP')
  const [currencies, setCurrencies] = useState<string[]>(['GBP'])
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // check Monzo connection
      const { data: token } = await supabase
        .from('monzo_tokens')
        .select('id')
        .eq('user_id', user.id)
        .single()
      setIsConnected(!!token)

      // fetch this month's transactions
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transacted_at', startOfMonth.toISOString())
        .order('transacted_at', { ascending: false })

      if (data) {
        setTransactions(data)
        const uniqueCurrencies = [...new Set(data.map((t: any) => t.currency as string))]
        setCurrencies(['GBP', ...uniqueCurrencies.filter(c => c !== 'GBP')])
      }
    }
    load()
  }, [])

  const chartData = period === 'daily'
    ? groupByDay(transactions, currency)
    : period === 'weekly'
    ? groupByWeek(transactions, currency)
    : groupByMonth(transactions, currency)

  const totalSpend = transactions.reduce((sum, t) => sum + (Number(t.amount) ?? 0), 0)
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Smart Money Tracker</h1>
        <Link href="/settings">
          <Button variant="outline" size="sm">Settings</Button>
        </Link>
      </div>

      {!isConnected && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-700 mb-3">
              Connect your Monzo account to automatically import transactions.
            </p>
            <Link href="/settings">
              <Button size="sm">Connect Monzo</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>This month&apos;s spending</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            £{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            {currencies.map(c => (
              <Button
                key={c}
                variant={currency === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrency(c as Currency)}
              >
                {c}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Spending overview</CardTitle>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as Period[]).map(p => (
                <Button
                  key={p}
                  variant={period === p ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPeriod(p)}
                >
                  {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'Monthly'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <SpendingChart data={chartData} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent transactions</CardTitle>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">View all →</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No transactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentTransactions.map(tx => (
                <li key={tx.id} className="flex justify-between items-center">
                  <span className="text-sm">{tx.merchant_name ?? 'Unknown'}</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {tx.currency} {Number(tx.amount).toFixed(2)}
                      {tx.is_estimated_rate && <span className="text-xs text-slate-400 ml-1">*est</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(tx.transacted_at).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
