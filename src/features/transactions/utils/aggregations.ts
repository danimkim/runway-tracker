interface Transaction {
  transacted_at: string
  krw_amount: number | null
  amount: number
  currency: string
}

export interface DataPoint {
  /**
   * The X-axis label for the data point.
   * - `groupByDay`: full date string e.g. `'2026-02-18'`
   * - `groupByWeek`: abbreviated day name e.g. `'Mon'`, `'Tue'`
   * - `groupByMonth`: zero-padded day of month e.g. `'01'`, `'18'`
   */
  label: string
  total: number
}

function getAmount(tx: Transaction, currency: string): number {
  if (currency === 'KRW') return tx.krw_amount ?? 0
  if (tx.currency === currency) return Number(tx.amount)
  return 0
}

export function groupByDay(transactions: Transaction[], currency: string): DataPoint[] {
  const map = new Map<string, number>()

  transactions.forEach(tx => {
    const label = tx.transacted_at.slice(0, 10) // YYYY-MM-DD
    const amount = getAmount(tx, currency)
    map.set(label, (map.get(label) ?? 0) + amount)
  })

  return Array.from(map.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function groupByWeek(transactions: Transaction[], currency: string): DataPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const result: DataPoint[] = days.map(label => ({ label, total: 0 }))

  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(0, 0, 0, 0)

  transactions.forEach(tx => {
    const txDate = new Date(tx.transacted_at)
    const dayIndex = (txDate.getDay() + 6) % 7 // Mon=0, Sun=6
    if (txDate >= monday) {
      result[dayIndex].total += getAmount(tx, currency)
    }
  })

  return result
}

export function groupByMonth(transactions: Transaction[], currency: string): DataPoint[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const result: DataPoint[] = Array.from({ length: daysInMonth }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    total: 0,
  }))

  transactions.forEach(tx => {
    const txDate = new Date(tx.transacted_at)
    if (txDate.getFullYear() === year && txDate.getMonth() === month) {
      const day = txDate.getDate() - 1
      result[day].total += getAmount(tx, currency)
    }
  })

  return result
}
