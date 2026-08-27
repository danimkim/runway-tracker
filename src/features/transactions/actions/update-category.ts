'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function updateTransactionCategory(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get('id') as string;
  const category = formData.get('category') as string;

  await supabase.from('transactions').update({ category }).eq('id', id);
  redirect('/transactions');
}
