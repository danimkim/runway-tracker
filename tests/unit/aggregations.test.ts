import { describe, it, expect } from 'vitest'
import { groupByDay, groupByWeek, groupByMonth } from '@/lib/utils/aggregations'

const now = new Date()
const year = now.getFullYear()
const month = String(now.getMonth() + 1).padStart(2, '0')

const mockTransactions = [
  { transacted_at: `${year}-${month}-18T10:00:00Z`, krw_amount: 21400, amount: 12.50, currency: 'GBP' },
  { transacted_at: `${year}-${month}-18T14:00:00Z`, krw_amount: 6506, amount: 3.80, currency: 'GBP' },
  { transacted_at: `${year}-${month}-17T09:00:00Z`, krw_amount: 42000, amount: 24.99, currency: 'GBP' },
  { transacted_at: `${year}-${month}-10T12:00:00Z`, krw_amount: 15000, amount: 15000, currency: 'KRW' },
]

describe('groupByDay', () => {
  it('sums krw_amount for transactions on the same date', () => {
    const result = groupByDay(mockTransactions, 'KRW')
    const feb18 = result.find(r => r.label === `${year}-${month}-18`)
    expect(feb18?.total).toBe(27906) // 21400 + 6506
  })
})

describe('groupByWeek', () => {
  it('returns 7 entries (Mon–Sun) with day and total properties', () => {
    const result = groupByWeek(mockTransactions, 'KRW')
    expect(result).toHaveLength(7)
    result.forEach(r => {
      expect(r).toHaveProperty('label')
      expect(r).toHaveProperty('total')
    })
  })
})

describe('groupByMonth', () => {
  it('returns one entry per day of the month with totals', () => {
    const result = groupByMonth(mockTransactions, 'KRW')
    const day18 = result.find(r => r.label === '18')
    expect(day18?.total).toBe(27906) // 21400 + 6506
  })
})
