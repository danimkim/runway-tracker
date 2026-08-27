import JSZip from 'jszip'
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/transactions/export/route'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const createClientMock = vi.mocked(createClient)

function createQueryResult(data: unknown[] = [], error: unknown = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    then: vi.fn((resolve) => Promise.resolve(resolve({ data, error }))),
  }

  return query
}

function createSupabaseMock({
  user = { id: 'user-123' },
  transactions = [],
  queryError = null,
  receiptBlob = new Blob(['receipt-image']),
  receiptError = null,
}: {
  user?: { id: string } | null
  transactions?: unknown[]
  queryError?: unknown
  receiptBlob?: Blob | null
  receiptError?: unknown
} = {}) {
  const query = createQueryResult(transactions, queryError)
  const download = vi.fn().mockResolvedValue({ data: receiptBlob, error: receiptError })
  const bucket = { download }
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn(() => query),
    storage: {
      from: vi.fn(() => bucket),
    },
  }

  createClientMock.mockResolvedValue(supabase as never)

  return { supabase, query }
}

function createRequest(url = 'http://localhost/api/transactions/export') {
  return new NextRequest(url)
}

describe('transactions export route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the user is not authenticated', async () => {
    const { supabase } = createSupabaseMock({ user: null })

    const response = await GET(createRequest())

    expect(response.status).toBe(401)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('queries the authenticated user transactions with inclusive date filters', async () => {
    const { query } = createSupabaseMock()

    await GET(createRequest('http://localhost/api/transactions/export?from=2026-08-01&to=2026-08-31'))

    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(query.eq).toHaveBeenCalledWith('status', 'Approved')
    expect(query.eq).toHaveBeenCalledWith('currency', 'GBP')
    expect(query.gte).toHaveBeenCalledWith('transacted_at', '2026-08-01T00:00:00.000Z')
    expect(query.lte).toHaveBeenCalledWith('transacted_at', '2026-08-31T23:59:59.999Z')
  })

  it('returns a zip with csv and downloadable receipts', async () => {
    createSupabaseMock({
      transactions: [
        {
          id: 'tx-123',
          merchant_name: 'Cafe Nero',
          amount: 4.5,
          currency: 'GBP',
          category: 'Food',
          approval_no: 'A-123',
          local_amount: 4.5,
          local_currency: 'GBP',
          exchange_rate: null,
          krw_amount: null,
          source: 'manual',
          receipt_url: 'user-123/tx-123.png',
          transacted_at: '2026-08-20T14:30:00Z',
        },
      ],
    })

    const response = await GET(createRequest())
    const zip = await JSZip.loadAsync(await response.arrayBuffer())
    const csv = await zip.file('transactions.csv')?.async('string')
    const receipt = zip.file('receipts/2026-08-20_Cafe-Nero_tx-123.png')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/zip')
    expect(response.headers.get('Content-Disposition')).toContain('transactions-export-')
    expect(csv).toContain('receipts/2026-08-20_Cafe-Nero_tx-123.png')
    expect(receipt).toBeTruthy()
  })

  it('keeps the transaction row when a receipt cannot be downloaded', async () => {
    createSupabaseMock({
      transactions: [
        {
          id: 'tx-123',
          merchant_name: 'Cafe Nero',
          amount: 4.5,
          currency: 'GBP',
          category: 'Food',
          approval_no: 'A-123',
          local_amount: 4.5,
          local_currency: 'GBP',
          exchange_rate: null,
          krw_amount: null,
          source: 'manual',
          receipt_url: 'user-123/missing.png',
          transacted_at: '2026-08-20T14:30:00Z',
        },
      ],
      receiptBlob: null,
      receiptError: new Error('missing'),
    })

    const response = await GET(createRequest())
    const zip = await JSZip.loadAsync(await response.arrayBuffer())
    const csv = await zip.file('transactions.csv')?.async('string')

    expect(csv).toContain('Cafe Nero')
    expect(csv).toContain('user-123/missing.png')
    expect(zip.file('receipts/2026-08-20_Cafe-Nero_tx-123.png')).toBeNull()
  })
})
