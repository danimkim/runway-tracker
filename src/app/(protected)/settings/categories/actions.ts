'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type ActionResult = { success: true } | { success: false; error: string };

export async function addCategory(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated.' };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { success: false, error: 'Name is required.' };

  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name,
    color: '#AAB5C5',
    emoji: '📦',
  });

  if (error) return { success: false, error: 'Failed to add category.' };

  revalidatePath('/settings/categories');
  return { success: true };
}

export async function updateCategoryName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get('id') as string;
  const name = (formData.get('name') as string)?.trim();
  if (!id || !name) return;

  await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id);

  revalidatePath('/settings/categories');
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const id = formData.get('id') as string;
  if (!id) return;

  await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  revalidatePath('/settings/categories');
}
