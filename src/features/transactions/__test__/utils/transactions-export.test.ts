import { describe, expect, it } from 'vitest'
import {
  buildDateFilters,
  buildReceiptFilePath,
  buildTransactionsCsv,
  isDateInput,
  type TransactionExportRecord,
} from '@/features/transactions/utils/export'

const baseTransaction: TransactionExportRecord = {
  id: 'tx-123',
  merchant_name: 'Cafe Nero',
  amount: 4.5,
  currency: 'GBP',
  category: 'Food',
  approval_no: 'A-123',
  local_amount: null,
  local_currency: null,
  exchange_rate: 1970.5,
  krw_amount: 8867,
  source: 'manual',
  receipt_url: 'user-123/tx-123.png',
  transacted_at: '2026-08-20T14:30:00Z',
}

describe('transactions export helpers', () => {
  it('escapes csv cells with commas, quotes, and empty values', () => {
    const csv = buildTransactionsCsv([
      {
        ...baseTransaction,
        merchant_name: 'Bob "The Bean", Cafe',
        category: null,
      },
    ])

    expect(csv).toContain('"Bob ""The Bean"", Cafe"')
    expect(csv).toContain('manual')
    expect(csv.split('\n')[1]).toContain(',,')
  })

  it('includes receipt file paths only when a receipt was added to the zip', () => {
    const receiptFiles = new Map([['tx-123', 'receipts/2026-08-20_Cafe-Nero_tx-123.png']])
    const csv = buildTransactionsCsv([baseTransaction], receiptFiles)

    expect(csv).toContain('receipts/2026-08-20_Cafe-Nero_tx-123.png')
    expect(csv).toContain('user-123/tx-123.png')
  })

  it('leaves receipt_file empty when the transaction has no downloadable receipt', () => {
    const csv = buildTransactionsCsv([baseTransaction])

    expect(csv.split('\n')[1]).toContain(',user-123/tx-123.png')
    expect(csv).not.toContain('receipts/2026-08-20_Cafe-Nero_tx-123.png')
  })

  it('builds safe receipt filenames from transaction metadata', () => {
    expect(
      buildReceiptFilePath({
        ...baseTransaction,
        merchant_name: 'M&S Food / Oxford Circus',
        receipt_url: 'user-123/original.HEIC',
      }),
    ).toBe('receipts/2026-08-20_MandS-Food-Oxford-Circus_tx-123.heic')
  })

  it('validates date inputs and builds inclusive day filters', () => {
    expect(isDateInput('2026-08-20')).toBe(true)
    expect(isDateInput('2026-02-31')).toBe(false)
    expect(isDateInput('20-08-2026')).toBe(false)
    expect(buildDateFilters({ from: '2026-08-01', to: '2026-08-31' })).toEqual({
      fromIso: '2026-08-01T00:00:00.000Z',
      toIso: '2026-08-31T23:59:59.999Z',
    })
  })
})
