'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addCategory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = (formData.get('name') as string)?.trim();
  if (!name) return;

  await supabase.from('categories').insert({
    user_id: user.id,
    name,
    color: '#AAB5C5',
    emoji: '📦',
  });

  revalidatePath('/settings/categories');
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
