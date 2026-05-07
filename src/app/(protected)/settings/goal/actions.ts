'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult = { success: true } | { success: false; error: string };

export async function updateTargetDate(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const targetDate = formData.get('targetDate') as string;
  if (!targetDate) return { success: false, error: 'Please select a date.' };

  const { error } = await supabase.from('user_settings').upsert(
    {
      user_id: user.id,
      target_date: targetDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) return { success: false, error: 'Failed to save. Please try again.' };

  revalidatePath('/settings');
  return { success: true };
}
