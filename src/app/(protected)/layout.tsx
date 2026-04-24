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
    <div style={{ minHeight: '100dvh', background: '#EEF0F8', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, position: 'relative', background: '#EEF0F8', minHeight: '100dvh' }}>
        {children}
        <BottomNav />
      </div>
    </div>
  )
}
