import { describe, it, expect, vi } from 'vitest'
import {
  calculateExchangeRate,
  fetchEstimatedRate,
  buildTransactionRateData,
} from '@/lib/utils/exchange-rate'

describe('calculateExchangeRate', () => {
  it('returns rate 1 and is_estimated_rate false for KRW transactions', () => {
    const result = calculateExchangeRate({
      amount: 15000,
      currency: 'KRW',
      krwDeducted: null,
    })
    expect(result.exchange_rate).toBe(1)
    expect(result.krw_amount).toBe(15000)
    expect(result.is_estimated_rate).toBe(false)
  })

  it('back-calculates actual rate when foreign currency and KRW deducted amount are both present', () => {
    const result = calculateExchangeRate({
      amount: 3.80,
      currency: 'GBP',
      krwDeducted: 6506,
    })
    expect(result.krw_amount).toBe(6506)
    expect(result.exchange_rate).toBeCloseTo(1712.1, 0)
    expect(result.is_estimated_rate).toBe(false)
  })

  it('returns null values and marks as estimated when KRW not yet settled (authorization hold)', () => {
    const result = calculateExchangeRate({
      amount: 3.80,
      currency: 'GBP',
      krwDeducted: null,
    })
    expect(result.krw_amount).toBeNull()
    expect(result.exchange_rate).toBeNull()
    expect(result.is_estimated_rate).toBe(true)
  })
})

describe('fetchEstimatedRate', () => {
  it('returns exchange rate from Frankfurter API response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rates: { KRW: 1712.5 } }),
    })

    const rate = await fetchEstimatedRate('GBP', '2025-02-18')
    expect(rate).toBe(1712.5)
  })

  it('returns null when API call fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    const rate = await fetchEstimatedRate('GBP', '2025-02-18')
    expect(rate).toBeNull()
  })
})

describe('buildTransactionRateData', () => {
  it('calculates krw_amount using estimated rate', () => {
    const result = buildTransactionRateData({
      amount: 3.80,
      estimatedRate: 1712.5,
    })
    expect(result.krw_amount).toBe(6508) // Math.round(3.80 * 1712.5)
    expect(result.exchange_rate).toBe(1712.5)
    expect(result.is_estimated_rate).toBe(true)
  })
})
