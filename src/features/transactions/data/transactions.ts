import { createClient } from '@/lib/supabase/server';

export interface TxDetail {
  id: string;
  merchant_name: string | null;
  amount: number | null;
  transacted_at: string | null;
  category: string | null;
  receipt_url: string | null;
}

export interface TxItem {
  id: string;
  merchant: string;
  amount: number | null;
  transacted_at: string | null;
  category: string | null;
  displayAmount: string;
  linkable: boolean;
}

export async function getTransactionById(id: string, userId: string): Promise<TxDetail | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('transactions')
    .select('id, merchant_name, amount, transacted_at, category, receipt_url')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  return data ?? null;
}

export interface TransactionDateRange {
  start: string;
  end: string;
}

// Continue until empty, including when the server caps batches below 1,000 rows.
async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  while (true) {
    const { data, error } = await fetchPage(rows.length, rows.length + 999);
    if (error) throw new Error('Failed to load transactions.', { cause: error });
    if (!data) throw new Error('Missing transaction data.');
    if (data.length === 0) return rows;
    rows.push(...data);
  }
}

export async function getGBPTransactions(userId: string, range?: TransactionDateRange): Promise<TxItem[]> {
  const supabase = await createClient();

  const data = await fetchAllRows((from, to) => {
    let query = supabase
      .from('transactions')
      .select('id, merchant_name, amount, transacted_at, category')
      .eq('user_id', userId)
      .eq('status', 'Approved')
      .order('transacted_at', { ascending: false })
      .order('id', { ascending: false });
    if (range) {
      query = query.gte('transacted_at', `${range.start}T00:00:00Z`).lt('transacted_at', `${range.end}T00:00:00Z`);
    }
    return query.range(from, to);
  });

  return (data ?? []).map((t) => ({
    id: t.id,
    merchant: t.merchant_name ?? 'Unknown',
    amount: t.amount,
    transacted_at: t.transacted_at,
    category: t.category,
    displayAmount: `-£${t.amount?.toFixed(2)}`,
    linkable: true,
  }));
}

export async function getKRWTransactions(userId: string, range?: TransactionDateRange): Promise<TxItem[]> {
  const supabase = await createClient();

  const data = await fetchAllRows((from, to) => {
    let query = supabase
      .from('exchange_records')
      .select('id, krw_out, exchanged_at')
      .eq('user_id', userId)
      .order('exchanged_at', { ascending: false })
      .order('id', { ascending: false });
    if (range) query = query.gte('exchanged_at', range.start).lt('exchanged_at', range.end);
    return query.range(from, to);
  });

  return (data ?? []).map((r) => ({
    id: r.id,
    merchant: 'Exchange',
    amount: r.krw_out,
    transacted_at: r.exchanged_at,
    category: null,
    displayAmount: `-₩${r.krw_out?.toLocaleString()}`,
    linkable: false,
  }));
}
