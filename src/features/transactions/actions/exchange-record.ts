'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function saveExchangeRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const krwOut = Number.parseFloat(formData.get('krwOut') as string);
  const gbpIn = Number.parseFloat(formData.get('gbpIn') as string);
  const exchangedAt = formData.get('exchangedAt') as string;
  const rate = Number.parseFloat((krwOut / gbpIn).toFixed(2));

  await supabase.from('exchange_records').insert({
    user_id: user.id,
    krw_out: krwOut,
    gbp_in: gbpIn,
    rate,
    exchanged_at: exchangedAt,
  });

  redirect('/transactions?tab=KRW');
}
