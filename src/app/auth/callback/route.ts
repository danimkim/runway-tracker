import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForToken, fetchAccounts } from '@/lib/monzo/client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/settings?error=${error ?? 'missing_code'}`, request.url)
    )
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const token = await exchangeCodeForToken(code)
    const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

    // fetch the user's first personal account ID
    const { accounts } = await fetchAccounts(token.access_token)
    const account = accounts.find(a => !a.description.includes('joint')) ?? accounts[0]

    await supabase
      .from('monzo_tokens')
      .upsert({
        user_id: user.id,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_at: expiresAt,
        account_id: account?.id ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    return NextResponse.redirect(new URL('/dashboard?connected=true', request.url))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(new URL('/settings?error=token_exchange_failed', request.url))
  }
}
