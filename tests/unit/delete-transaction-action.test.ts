import { redirect } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteTransaction } from '@/app/(protected)/transactions/[id]/actions'
import { createClient } from '@/lib/supabase/server'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`)
  }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const createClientMock = vi.mocked(createClient)
const redirectMock = vi.mocked(redirect)

function createFormData(id = 'transaction-123') {
  const formData = new FormData()
  formData.set('id', id)
  return formData
}

function mockSelectQuery({
  transaction = { receipt_url: 'user-123/transaction-123.png' },
  fetchError = null,
}: {
  transaction?: { receipt_url: string | null } | null
  fetchError?: unknown
} = {}) {
  const single = vi.fn().mockResolvedValue({ data: transaction, error: fetchError })
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    single,
  }

  return query
}

function mockDeleteQuery({ deleteError = null }: { deleteError?: unknown } = {}) {
  let eqCount = 0
  const query = {
    delete: vi.fn(() => query),
    eq: vi.fn(() => {
      eqCount += 1

      if (eqCount === 2) {
        return Promise.resolve({ error: deleteError })
      }

      return query
    }),
  }

  return query
}

function mockSupabase({
  user = { id: 'user-123' },
  transaction = { receipt_url: 'user-123/transaction-123.png' },
  fetchError = null,
  deleteError = null,
}: {
  user?: { id: string } | null
  transaction?: { receipt_url: string | null } | null
  fetchError?: unknown
  deleteError?: unknown
} = {}) {
  const selectQuery = mockSelectQuery({ transaction, fetchError })
  const deleteQuery = mockDeleteQuery({ deleteError })
  const remove = vi.fn().mockResolvedValue({ error: null })

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn(() => ({
      select: selectQuery.select,
      delete: deleteQuery.delete,
    })),
    storage: {
      from: vi.fn(() => ({ remove })),
    },
  }

  createClientMock.mockResolvedValue(supabase as never)

  return { supabase, selectQuery, deleteQuery, remove }
}

describe('deleteTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to login when the user is not authenticated', async () => {
    const { supabase } = mockSupabase({ user: null })

    await expect(deleteTransaction(createFormData())).rejects.toThrow('NEXT_REDIRECT:/login')

    expect(supabase.from).not.toHaveBeenCalled()
    expect(redirectMock).toHaveBeenCalledWith('/login')
  })

  it('redirects to transactions when the transaction cannot be found for the user', async () => {
    const { deleteQuery, remove } = mockSupabase({
      transaction: null,
      fetchError: new Error('not found'),
    })

    await expect(deleteTransaction(createFormData())).rejects.toThrow('NEXT_REDIRECT:/transactions')

    expect(deleteQuery.delete).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(redirectMock).toHaveBeenCalledWith('/transactions')
  })

  it('deletes the transaction for the authenticated user and redirects to transactions', async () => {
    const { selectQuery, deleteQuery, remove } = mockSupabase()

    await expect(deleteTransaction(createFormData())).rejects.toThrow('NEXT_REDIRECT:/transactions')

    expect(selectQuery.select).toHaveBeenCalledWith('receipt_url')
    expect(selectQuery.eq).toHaveBeenCalledWith('id', 'transaction-123')
    expect(selectQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(deleteQuery.delete).toHaveBeenCalled()
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', 'transaction-123')
    expect(deleteQuery.eq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(remove).toHaveBeenCalledWith(['user-123/transaction-123.png'])
    expect(redirectMock).toHaveBeenCalledWith('/transactions')
  })

  it('does not remove a receipt when the transaction does not have one', async () => {
    const { remove } = mockSupabase({ transaction: { receipt_url: null } })

    await expect(deleteTransaction(createFormData())).rejects.toThrow('NEXT_REDIRECT:/transactions')

    expect(remove).not.toHaveBeenCalled()
    expect(redirectMock).toHaveBeenCalledWith('/transactions')
  })

  it('throws when deleting the transaction fails', async () => {
    const deleteError = new Error('delete failed')
    const { remove } = mockSupabase({ deleteError })

    await expect(deleteTransaction(createFormData())).rejects.toThrow(deleteError)

    expect(remove).not.toHaveBeenCalled()
  })
})
