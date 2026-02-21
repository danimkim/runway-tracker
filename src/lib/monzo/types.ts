export interface MonzoTokenResponse {
  access_token: string
  client_id: string
  expires_in: number
  refresh_token: string
  token_type: 'Bearer'
  user_id: string
}

export interface MonzoMerchant {
  id: string
  name: string
  category: string
}

export interface MonzoTransaction {
  id: string                    // "tx_..."
  created: string               // ISO 8601
  description: string           // fallback merchant name
  amount: number                // minor units (pence), negative = debit
  currency: string              // account currency (GBP)
  local_amount: number          // minor units in local currency
  local_currency: string        // foreign currency code if abroad
  merchant: MonzoMerchant | null
  category: string
  settled: string               // ISO 8601, empty string if pending
  decline_reason: string | null
}

export interface MonzoTransactionListResponse {
  transactions: MonzoTransaction[]
}

export interface MonzoAccountsResponse {
  accounts: Array<{
    id: string
    description: string
    created: string
  }>
}
