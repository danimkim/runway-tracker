'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function verifyAndSendReset(
  prevState: { error: string } | { success: true } | null,
  formData: FormData,
): Promise<{ error: string } | { success: true } | null> {
  const currentPassword = formData.get('currentPassword') as string;

  if (!currentPassword) return { error: 'Current password is required.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return { error: 'Not authenticated.' };

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) return { error: 'Current password is incorrect.' };

  const headersList = await headers();
  const origin = headersList.get('origin') ?? '';

  const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (resetError) return { error: 'Failed to send reset email. Please try again.' };

  return { success: true };
}
