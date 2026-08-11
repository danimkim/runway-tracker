import { createClient } from '@/lib/supabase/server';
import type { SupabaseServerClient } from '@/lib/supabase/server';

export interface AccountBalances {
  krwBalance: number;
  gbpBalance: number;
}

export async function getAccountBalances(
  userId: string,
  supabaseClient?: SupabaseServerClient,
): Promise<AccountBalances> {
  const supabase = supabaseClient ?? await createClient();

  const { data: accounts } = await supabase
    .from('accounts')
    .select('currency, balance')
    .eq('user_id', userId);

  return {
    krwBalance: accounts?.find((account) => account.currency === 'KRW')?.balance ?? 0,
    gbpBalance: accounts?.find((account) => account.currency === 'GBP')?.balance ?? 0,
  };
}
