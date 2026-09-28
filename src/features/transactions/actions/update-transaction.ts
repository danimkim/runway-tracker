'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_NAMES } from '@/lib/categories';

type ActionResult = { success: false; error: string } | null;

function parseAmount(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return Number.NaN;
  return Number.parseFloat(value);
}

export async function updateTransaction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const id = (formData.get('id') as string | null)?.trim();
  const merchantName = (formData.get('merchantName') as string | null)?.trim();
  const amount = parseAmount(formData.get('amount'));
  const transactedAt = formData.get('transactedAt') as string | null;
  const category = formData.get('category') as string | null;

  if (!id) return { success: false, error: 'Transaction is required.' };
  if (!merchantName) return { success: false, error: 'Merchant name is required.' };
  if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: 'Enter a valid amount.' };
  if (!transactedAt) return { success: false, error: 'Transaction date and time are required.' };
  if (category && !CATEGORY_NAMES.includes(category as (typeof CATEGORY_NAMES)[number])) {
    return { success: false, error: 'Choose a valid category.' };
  }

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('krw_amount')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !transaction) return { success: false, error: 'Transaction not found.' };

  const krwAmount = transaction.krw_amount;

  const { error } = await supabase
    .from('transactions')
    .update({
      merchant_name: merchantName,
      amount,
      local_amount: amount,
      exchange_rate: krwAmount === null ? null : krwAmount / amount,
      category: category || null,
      transacted_at: transactedAt,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'Failed to update transaction.' };

  revalidatePath('/transactions');
  revalidatePath(`/transactions/${id}`);
  redirect(`/transactions/${id}`);
}
