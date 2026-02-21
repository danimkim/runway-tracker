import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/monzo/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { logout } from '@/app/(auth)/login/actions'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: token } = await supabase
    .from('monzo_tokens')
    .select('account_id, updated_at')
    .eq('user_id', user!.id)
    .single()

  const connectUrl = getAuthorizationUrl(user!.id)

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monzo Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {token ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600 font-medium">Connected</p>
              {token.account_id && (
                <p className="text-sm text-slate-600">Account ID: {token.account_id}</p>
              )}
              <p className="text-sm text-slate-400">
                Last updated: {new Date(token.updated_at).toLocaleString('en-GB')}
              </p>
              <a href={connectUrl}>
                <Button variant="outline" size="sm">Reconnect</Button>
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Connect your Monzo account to automatically import transactions.
              </p>
              <a href={connectUrl}>
                <Button>Connect Monzo</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">{user!.email}</p>
          <form action={logout}>
            <Button variant="destructive" type="submit">Sign Out</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
