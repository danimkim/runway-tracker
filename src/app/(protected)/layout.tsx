import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', user.id).limit(1)
  const isOnboarded = (accounts?.length ?? 0) > 0
  if (!isOnboarded) redirect('/onboarding/account')

  return (
    <div className="min-h-dvh bg-surface flex justify-center">
      <div className="w-full max-w-[430px] relative bg-surface min-h-dvh">
        {children}
        <BottomNav />
      </div>
    </div>
  )
}
