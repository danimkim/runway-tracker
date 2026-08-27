'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CATEGORY_NAMES } from '@/lib/categories';
import { getReceiptFile, uploadReceiptImage, validateReceiptImage } from '@/features/transactions/utils/receipt-upload';

type ActionResult = { success: false; error: string } | null;

function parseAmount(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') return Number.NaN;
  return Number.parseFloat(value);
}

export async function createTransaction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const merchantName = (formData.get('merchantName') as string | null)?.trim();
  const amount = parseAmount(formData.get('amount'));
  const transactedAt = formData.get('transactedAt') as string | null;
  const category = formData.get('category') as string | null;
  const receipt = getReceiptFile(formData.get('receipt'));

  if (!merchantName) return { success: false, error: 'Merchant name is required.' };
  if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: 'Enter a valid amount.' };
  if (!transactedAt) return { success: false, error: 'Transaction date and time are required.' };
  if (category && !CATEGORY_NAMES.includes(category as (typeof CATEGORY_NAMES)[number])) {
    return { success: false, error: 'Choose a valid category.' };
  }
  if (receipt) {
    const receiptError = validateReceiptImage(receipt);
    if (receiptError) return { success: false, error: receiptError };
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      transaction_id: `manual_${user.id}_${crypto.randomUUID()}`,
      merchant_name: merchantName,
      amount,
      currency: 'GBP',
      local_amount: amount,
      local_currency: 'GBP',
      krw_amount: null,
      exchange_rate: null,
      status: 'Approved',
      source: 'manual',
      account_type: 'GBP',
      is_estimated_rate: false,
      category: category || null,
      receipt_url: null,
      transacted_at: transactedAt,
    })
    .select('id')
    .single();

  if (error || !transaction) {
    return { success: false, error: 'Failed to create transaction.' };
  }

  if (receipt) {
    const upload = await uploadReceiptImage(supabase, { file: receipt, userId: user.id, id: transaction.id });

    if (upload.error) return { success: false, error: 'Transaction created, but failed to upload receipt image.' };

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ receipt_url: upload.path })
      .eq('id', transaction.id);

    if (updateError) {
      if (upload.path) await supabase.storage.from('receipts').remove([upload.path]);
      return { success: false, error: 'Transaction created, but failed to attach receipt image.' };
    }
  }

  revalidatePath('/transactions');
  redirect('/transactions?tab=GBP');
}
