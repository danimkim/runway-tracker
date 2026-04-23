'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateTargetDate(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const targetDate = formData.get('targetDate') as string;

  await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      target_date: targetDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  revalidatePath('/dashboard');
}
