'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function saveOnboardingData(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const krwBalance = Number.parseFloat(formData.get('krwBalance') as string) || 0;
  const gbpBalance = Number.parseFloat(formData.get('gbpBalance') as string) || 0;
  const targetDate = formData.get('targetDate') as string;

  await supabase.from('accounts').upsert(
    [
      { user_id: user.id, currency: 'KRW', balance: krwBalance },
      { user_id: user.id, currency: 'GBP', balance: gbpBalance },
    ],
    { onConflict: 'user_id,currency' },
  );

  await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, target_date: targetDate },
      { onConflict: 'user_id' },
    );

  redirect('/dashboard');
}
