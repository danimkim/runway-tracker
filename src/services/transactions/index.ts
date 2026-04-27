import { createClient } from '@/lib/supabase/server'

export interface TxDetail {
  id: string
  merchant_name: string | null
  amount: number | null
  transacted_at: string | null
  category: string | null
  receipt_url: string | null
}

export async function getTransactionById(id: string, userId: string): Promise<TxDetail | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('transactions')
    .select('id, merchant_name, amount, transacted_at, category, receipt_url')
    .eq('id', id)
    .eq('user_id', userId)
    .single()
  return data ?? null
}

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
