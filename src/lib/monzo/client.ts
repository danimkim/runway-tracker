import type { MonzoTokenResponse, MonzoTransactionListResponse, MonzoAccountsResponse } from './types'

const AUTH_URL = 'https://auth.monzo.com'
const API_URL = 'https://api.monzo.com'
const CLIENT_ID = process.env.MONZO_CLIENT_ID!
const CLIENT_SECRET = process.env.MONZO_CLIENT_SECRET!

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    response_type: 'code',
    state,
  })
  return `${AUTH_URL}/?${params}`
}

export async function exchangeCodeForToken(code: string): Promise<MonzoTokenResponse> {
  const res = await fetch(`${API_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      code,
    }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<MonzoTokenResponse> {
  const res = await fetch(`${API_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json()
}

export async function fetchAccounts(accessToken: string): Promise<MonzoAccountsResponse> {
  const res = await fetch(`${API_URL}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Accounts fetch failed: ${res.status}`)
  return res.json()
}

export async function fetchTransactions(
  accessToken: string,
  accountId: string,
  since: string, // ISO 8601
  before: string // ISO 8601
): Promise<MonzoTransactionListResponse> {
  const params = new URLSearchParams({
    account_id: accountId,
    since,
    before,
    'expand[]': 'merchant',
  })
  const res = await fetch(`${API_URL}/transactions?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`Transactions fetch failed: ${res.status}`)
  return res.json()
}
