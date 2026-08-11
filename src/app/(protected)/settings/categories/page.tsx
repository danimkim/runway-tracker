import { createClient } from '@/lib/supabase/server';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { CategoriesList } from '@/features/settings/components/CategoriesList';
import { getCategories } from '@/features/settings/data/categories';

export default async function ManageCategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const categories = await getCategories(user!.id, supabase);

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Manage Categories" backHref="/settings" />
      <div className="p-5 pb-24 flex flex-col gap-4">
        <CategoriesList categories={categories} />
      </div>
    </div>
  );
}
