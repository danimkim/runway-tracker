'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateTransactionCategory(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const category = formData.get('category') as string

  await supabase.from('transactions').update({ category }).eq('id', id)
  redirect('/transactions')
}
