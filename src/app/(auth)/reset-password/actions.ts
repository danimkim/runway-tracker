'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function resetPassword(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string } | null> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) return { error: 'Passwords do not match.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Invalid or expired reset link. Please request a new one.' }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  redirect('/login')
}
