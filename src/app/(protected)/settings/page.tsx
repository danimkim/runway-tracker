import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/(protected)/settings/actions'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="screen has-bottom-nav">
      <div style={{ padding: '24px 20px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32 }}>
          {user?.email}
        </p>
        <form action={logout}>
          <button type="submit" className="btn-primary">Sign Out</button>
        </form>
      </div>
    </div>
  )
}
