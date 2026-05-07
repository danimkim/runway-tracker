import { createClient } from '@/lib/supabase/server';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { CATEGORY_NAMES, CATEGORY_COLORS, CATEGORY_EMOJI } from '@/lib/categories';
import { CategoriesList } from './CategoriesList';

export default async function ManageCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user!.id)
    .limit(1);

  if (!existing || existing.length === 0) {
    await supabase.from('categories').insert(
      CATEGORY_NAMES.map((name) => ({
        user_id: user!.id,
        name,
        color: CATEGORY_COLORS[name],
        emoji: CATEGORY_EMOJI[name],
      }))
    );
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color, emoji')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: true });

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Manage Categories" backHref="/settings" />
      <div className="p-5 pb-24 flex flex-col gap-4">
        <CategoriesList categories={categories ?? []} />
      </div>
    </div>
  );
}
