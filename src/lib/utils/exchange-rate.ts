interface RateInput {
  amount: number
  currency: string
  krwDeducted: number | null
}

interface RateResult {
  exchange_rate: number | null
  krw_amount: number | null
  is_estimated_rate: boolean
}

export function calculateExchangeRate({ amount, currency, krwDeducted }: RateInput): RateResult {
  if (currency === 'KRW') {
    return {
      exchange_rate: 1,
      krw_amount: Math.round(amount),
      is_estimated_rate: false,
    }
  }

  if (krwDeducted !== null) {
    return {
      exchange_rate: krwDeducted / amount,
      krw_amount: krwDeducted,
      is_estimated_rate: false,
    }
  }

  // authorization hold in foreign currency — KRW not yet settled
  return {
    exchange_rate: null,
    krw_amount: null,
    is_estimated_rate: true,
  }
}

export async function fetchEstimatedRate(
  currency: string,
  date: string // YYYY-MM-DD
): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.frankfurter.app/${date}?from=${currency}&to=KRW`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.rates?.KRW ?? null
  } catch {
    return null
  }
}

export function buildTransactionRateData({
  amount,
  estimatedRate,
}: {
  amount: number
  estimatedRate: number
}): RateResult {
  return {
    exchange_rate: estimatedRate,
    krw_amount: Math.round(amount * estimatedRate),
    is_estimated_rate: true,
  }
}
