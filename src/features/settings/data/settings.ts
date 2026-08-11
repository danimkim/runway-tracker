import { createClient } from '@/lib/supabase/server';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import { getAccountBalances } from './accounts';

export async function getTargetDate(
  userId: string,
  supabaseClient?: SupabaseServerClient,
): Promise<string | null> {
  const supabase = supabaseClient ?? await createClient();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('target_date')
    .eq('user_id', userId)
    .single();

  return settings?.target_date ?? null;
}

export async function getSettingsOverview(userId: string, supabaseClient?: SupabaseServerClient) {
  const supabase = supabaseClient ?? await createClient();

  const [accountBalances, targetDate] = await Promise.all([
    getAccountBalances(userId, supabase),
    getTargetDate(userId, supabase),
  ]);

  return {
    ...accountBalances,
    targetDate,
  };
}
