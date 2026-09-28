'use server';

import { createClient } from '@/lib/supabase/server';

export async function searchMerchantNames(query: string): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc('search_merchant_names', {
    search_text: query.trim().slice(0, 100),
    max_results: 5,
  });

  if (error) return [];
  return data.map(({ merchant_name }) => merchant_name);
}
