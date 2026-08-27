import { calcActualGBPBalance, calcActualKRWBalance } from '@/lib/balance'

describe('calcActualGBPBalance', () => {
  it('returns initial balance when there are no exchanges or transactions', () => {
    expect(calcActualGBPBalance({ initialBalance: 1000, totalGbpIn: 0, totalTransactions: 0 })).toBe(1000)
  })

  it('calculates initialBalance + totalGbpIn - totalTransactions', () => {
    expect(calcActualGBPBalance({ initialBalance: 1000, totalGbpIn: 500, totalTransactions: 300 })).toBe(1200)
  })

  it('returns negative value when transactions exceed balance', () => {
    expect(calcActualGBPBalance({ initialBalance: 100, totalGbpIn: 0, totalTransactions: 200 })).toBe(-100)
  })
})

describe('calcActualKRWBalance', () => {
  it('returns initial balance when there are no exchange outflows', () => {
    expect(calcActualKRWBalance({ initialBalance: 5000000, totalKrwOut: 0 })).toBe(5000000)
  })

  it('calculates initialBalance - totalKrwOut', () => {
    expect(calcActualKRWBalance({ initialBalance: 5000000, totalKrwOut: 1500000 })).toBe(3500000)
  })

  it('returns negative value when outflows exceed initial balance', () => {
    expect(calcActualKRWBalance({ initialBalance: 1000000, totalKrwOut: 2000000 })).toBe(-1000000)
  })
})
