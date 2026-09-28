import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateTransaction } from '@/features/transactions/actions/update-transaction';
import { createClient } from '@/lib/supabase/server';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const createClientMock = vi.mocked(createClient);
const revalidatePathMock = vi.mocked(revalidatePath);
const redirectMock = vi.mocked(redirect);

function createFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();

  formData.set('id', 'transaction-123');
  formData.set('merchantName', 'Pret A Manger');
  formData.set('amount', '12.50');
  formData.set('transactedAt', '2026-08-19T09:30');
  formData.set('category', 'Food');

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

function mockSelectQuery({
  transaction = { krw_amount: 25000 },
  fetchError = null,
}: {
  transaction?: { krw_amount: number | null } | null;
  fetchError?: unknown;
} = {}) {
  const single = vi.fn().mockResolvedValue({ data: transaction, error: fetchError });
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    single,
  };

  return query;
}

function mockUpdateQuery({ updateError = null }: { updateError?: unknown } = {}) {
  let eqCount = 0;
  const query = {
    update: vi.fn(() => query),
    eq: vi.fn(() => {
      eqCount += 1;

      if (eqCount === 2) {
        return Promise.resolve({ error: updateError });
      }

      return query;
    }),
  };

  return query;
}

function mockSupabase({
  user = { id: 'user-123' },
  transaction = { krw_amount: 25000 },
  fetchError = null,
  updateError = null,
}: {
  user?: { id: string } | null;
  transaction?: { krw_amount: number | null } | null;
  fetchError?: unknown;
  updateError?: unknown;
} = {}) {
  const selectQuery = mockSelectQuery({ transaction, fetchError });
  const updateQuery = mockUpdateQuery({ updateError });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn(() => ({
      select: selectQuery.select,
      update: updateQuery.update,
    })),
  };

  createClientMock.mockResolvedValue(supabase as never);

  return { supabase, selectQuery, updateQuery };
}

describe('updateTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login when the user is not authenticated', async () => {
    const { supabase } = mockSupabase({ user: null });

    await expect(updateTransaction(null, createFormData())).rejects.toThrow('NEXT_REDIRECT:/login');

    expect(supabase.from).not.toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('returns a validation error when merchant name is missing', async () => {
    const { updateQuery } = mockSupabase();
    const result = await updateTransaction(null, createFormData({ merchantName: '   ' }));

    expect(result).toEqual({ success: false, error: 'Merchant name is required.' });
    expect(updateQuery.update).not.toHaveBeenCalled();
  });

  it('returns an error when the transaction cannot be found for the user', async () => {
    const { updateQuery } = mockSupabase({ transaction: null, fetchError: new Error('not found') });

    const result = await updateTransaction(null, createFormData());

    expect(result).toEqual({ success: false, error: 'Transaction not found.' });
    expect(updateQuery.update).not.toHaveBeenCalled();
  });

  it('updates the transaction and redirects back to the detail page', async () => {
    const { selectQuery, updateQuery } = mockSupabase();

    await expect(updateTransaction(null, createFormData())).rejects.toThrow(
      'NEXT_REDIRECT:/transactions/transaction-123',
    );

    expect(selectQuery.select).toHaveBeenCalledWith('krw_amount');
    expect(selectQuery.eq).toHaveBeenCalledWith('id', 'transaction-123');
    expect(selectQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(updateQuery.update).toHaveBeenCalledWith({
      merchant_name: 'Pret A Manger',
      amount: 12.5,
      local_amount: 12.5,
      exchange_rate: 2000,
      category: 'Food',
      transacted_at: '2026-08-19T09:30',
    });
    expect(updateQuery.eq).toHaveBeenCalledWith('id', 'transaction-123');
    expect(updateQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(revalidatePathMock).toHaveBeenCalledWith('/transactions');
    expect(revalidatePathMock).toHaveBeenCalledWith('/transactions/transaction-123');
    expect(redirectMock).toHaveBeenCalledWith('/transactions/transaction-123');
  });

  it('clears category and exchange rate when those values are empty', async () => {
    const { updateQuery } = mockSupabase({ transaction: { krw_amount: null } });

    await expect(updateTransaction(null, createFormData({ category: '' }))).rejects.toThrow(
      'NEXT_REDIRECT:/transactions/transaction-123',
    );

    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        exchange_rate: null,
        category: null,
      }),
    );
  });

  it('returns an error when the update fails', async () => {
    mockSupabase({ updateError: new Error('update failed') });

    const result = await updateTransaction(null, createFormData());

    expect(result).toEqual({ success: false, error: 'Failed to update transaction.' });
  });
});
