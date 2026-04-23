'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReceiptUpload } from '@/features/transactions/components/ReceiptUpload'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [userId, setUserId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transacted_at', { ascending: false })

      if (data) setTransactions(data)
    }
    load()
  }, [])

  // group transactions by date
  const grouped = transactions.reduce((acc, tx) => {
    const date = new Date(tx.transacted_at).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(tx)
    return acc
  }, {} as Record<string, any[]>)

  function handleReceiptUpload(txId: string, url: string) {
    setTransactions(prev =>
      prev.map(tx => tx.id === txId ? { ...tx, receipt_url: url } : tx)
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">← Dashboard</Button>
        </Link>
        <h1 className="text-2xl font-bold">Transactions</h1>
      </div>

      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date}>
          <h2 className="text-sm font-semibold text-slate-500 mb-2">{date}</h2>
          <div className="space-y-2">
            {(txs as any[]).map(tx => (
              <Card key={tx.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{tx.merchant_name ?? 'Unknown'}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(tx.transacted_at).toLocaleTimeString('en-GB', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {tx.currency} {Number(tx.amount).toFixed(2)}
                      </p>
                      {tx.is_estimated_rate && (
                        <p className="text-xs text-slate-400">*estimated rate</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2">
                    <ReceiptUpload
                      transactionId={tx.id}
                      userId={userId}
                      currentReceiptUrl={tx.receipt_url}
                      onUpload={(url) => handleReceiptUpload(tx.id, url)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {transactions.length === 0 && (
        <p className="text-center text-slate-400 py-12">No transactions yet.</p>
      )}
    </div>
  )
}
