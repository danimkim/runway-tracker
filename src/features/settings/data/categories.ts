import { createClient } from '@/lib/supabase/server';
import type { SupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];

export type SettingsCategory = Pick<CategoryRow, 'id' | 'name' | 'color' | 'emoji'>;

export async function getCategories(
  userId: string,
  supabaseClient?: SupabaseServerClient,
): Promise<SettingsCategory[]> {
  const supabase = supabaseClient ?? await createClient();

  const { data } = await supabase
    .from('categories')
    .select('id, name, color, emoji')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  return data ?? [];
}
