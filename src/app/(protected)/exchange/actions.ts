'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function saveExchangeRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const krwOut = parseFloat(formData.get('krwOut') as string);
  const gbpIn = parseFloat(formData.get('gbpIn') as string);
  const exchangedAt = formData.get('exchangedAt') as string;
  const rate = parseFloat((krwOut / gbpIn).toFixed(2));

  await supabase.from('exchange_records').insert({
    user_id: user.id,
    krw_out: krwOut,
    gbp_in: gbpIn,
    rate,
    exchanged_at: exchangedAt,
  });

  redirect('/settings');
}
