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

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get('id') as string

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('receipt_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !transaction) redirect('/transactions')

  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    throw deleteError
  }

  if (transaction.receipt_url) {
    await supabase.storage.from('receipts').remove([transaction.receipt_url])
  }

  redirect('/transactions')
}
