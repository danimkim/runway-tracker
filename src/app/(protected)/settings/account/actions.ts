'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult = { success: true } | { success: false; error: string };

export async function updateAccountBalances(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const krwBalance = parseFloat(formData.get('krwBalance') as string) || 0;
  const gbpBalance = parseFloat(formData.get('gbpBalance') as string) || 0;

  const { error } = await supabase.from('accounts').upsert(
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

  if (error) return { success: false, error: 'Failed to save. Please try again.' };

  revalidatePath('/dashboard');
  revalidatePath('/settings/account');
  return { success: true };
}
