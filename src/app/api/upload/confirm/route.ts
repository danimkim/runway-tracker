import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { TossBankTransaction } from '@/lib/tossbank/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as { transactions: TossBankTransaction[] };
  const approved = (body.transactions ?? []).filter((t) => t.status === 'Approved');

  if (approved.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: 0 });
  }

  const rows = approved.map((t) => ({
    user_id: user.id,
    transaction_id: `${user.id}_${t.approval_no}`,
    approval_no: t.approval_no,
    transacted_at: t.transacted_at,
    merchant_name: t.merchant_name,
    amount: t.local_amount,
    currency: t.local_currency,
    local_amount: t.local_amount,
    local_currency: t.local_currency,
    krw_amount: t.krw_amount,
    exchange_rate: t.exchange_rate,
    status: t.status,
    source: 'tossbank_pdf',
    account_type: 'GBP',
    is_estimated_rate: false,
  }));

  const { data, error } = await supabase
    .from('transactions')
    .upsert(rows, { onConflict: 'user_id,approval_no', ignoreDuplicates: true })
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const inserted = data?.length ?? 0;
  const skipped = approved.length - inserted;

  return NextResponse.json({ inserted, skipped });
}
