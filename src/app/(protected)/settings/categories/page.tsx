import { createClient } from '@/lib/supabase/server';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { CategoriesList } from './CategoriesList';

export default async function ManageCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
