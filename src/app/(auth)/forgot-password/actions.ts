'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function requestPasswordReset(
  prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const email = (formData.get('email') as string).trim()

  if (!email) return { error: 'Email is required.' };
  const [headersList, supabase] = await Promise.all([headers(), createClient()]);

  const origin = headersList.get('origin') ?? '';

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })
  } catch {
    // Silently ignore — always redirect to prevent email enumeration
  }

  redirect('/forgot-password/confirm')
}
