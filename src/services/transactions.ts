import { createClient } from '@/lib/supabase/server'

export interface TxItem {
  id: string
  merchant: string
  amount: number | null
  transacted_at: string | null
  category: string | null
  displayAmount: string
  linkable: boolean
}

export async function getGBPTransactions(userId: string): Promise<TxItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'Approved')
    .order('transacted_at', { ascending: false })

  return (data ?? []).map((t) => ({
    id: t.id,
    merchant: t.merchant_name ?? 'Unknown',
    amount: t.amount,
    transacted_at: t.transacted_at,
    category: t.category,
    displayAmount: `-£${t.amount?.toFixed(2)}`,
    linkable: true,
  }))
}

export async function getKRWTransactions(userId: string): Promise<TxItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('exchange_records')
    .select('*')
    .eq('user_id', userId)
    .order('exchanged_at', { ascending: false })

  return (data ?? []).map((r) => ({
    id: r.id,
    merchant: 'Exchange',
    amount: r.krw_out,
    transacted_at: r.exchanged_at,
    category: null,
    displayAmount: `-₩${r.krw_out?.toLocaleString()}`,
    linkable: false,
  }))
}
