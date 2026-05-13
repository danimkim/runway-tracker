'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateAccountBalances(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const krwBalance = parseFloat(formData.get('krwBalance') as string) || 0;
  const gbpBalance = parseFloat(formData.get('gbpBalance') as string) || 0;

  await supabase.from('accounts').upsert(
    [
      {
        user_id: user.id,
        currency: 'KRW',
        balance: krwBalance,
        updated_at: new Date().toISOString(),
      },
      {
        user_id: user.id,
        currency: 'GBP',
        balance: gbpBalance,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: 'user_id,currency' },
  );

  revalidatePath('/dashboard');
  revalidatePath('/settings/account');
}
