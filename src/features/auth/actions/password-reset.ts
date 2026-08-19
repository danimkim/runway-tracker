'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type PasswordResetState = { error: string } | null;

export async function requestPasswordReset(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const email = (formData.get('email') as string).trim();

  if (!email) return { error: 'Email is required.' };

  const [headersList, supabase] = await Promise.all([headers(), createClient()]);
  const origin = headersList.get('origin') ?? '';

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
  } catch {
    // Always redirect to avoid leaking whether an email exists.
  }

  redirect('/forgot-password/confirm');
}

export async function resetPassword(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) return { error: 'Passwords do not match.' };
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Invalid or expired reset link. Please request a new one.' };

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  redirect('/login');
}
