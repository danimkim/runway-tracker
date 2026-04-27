'use server';

import { createClient } from '@/lib/supabase/server';

export async function signup(
  prevState: { error: string } | { email: string } | null,
  formData: FormData,
): Promise<{ error: string } | { email: string } | null> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  return { email };
}
