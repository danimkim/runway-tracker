import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types';

type ExchangeRateCache = Pick<Tables<'user_settings'>, 'exchange_rate' | 'exchange_rate_at'>;

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest?from=GBP&to=KRW';

async function fetchRateFromApi(): Promise<number> {
  const res = await fetch(FRANKFURTER_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
  const data = await res.json();
  return data.rates.KRW as number;
}

export async function getExchangeRate(userId: string): Promise<number> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('exchange_rate, exchange_rate_at')
    .eq('user_id', userId)
    .single() as { data: ExchangeRateCache | null; error: unknown };

  const today = new Date().toISOString().slice(0, 10);
  const cachedRate = settings?.exchange_rate;
  const isCacheValid =
    settings?.exchange_rate_at === today && cachedRate != null;

  if (isCacheValid) {
    return cachedRate;
  }

  // Handle errors at the top level (Server Component/Action)
  const rate = await fetchRateFromApi();

  // Only cache if the user_settings row already exists (created during onboarding)
  if (settings) {
    await supabase
      .from('user_settings')
      .update({ exchange_rate: rate, exchange_rate_at: today })
      .eq('user_id', userId);
  }

  return rate;
}
