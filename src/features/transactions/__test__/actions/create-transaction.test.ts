import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTransaction } from '@/features/transactions/actions/create-transaction';
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

function createFormData(overrides: Record<string, string | File> = {}) {
  const formData = new FormData();

  formData.set('merchantName', 'Pret A Manger');
  formData.set('amount', '12.50');
  formData.set('transactedAt', '2026-08-19T09:30');
  formData.set('category', 'Food');

  for (const [key, value] of Object.entries(overrides)) {
    formData.set(key, value);
  }

  return formData;
}

function mockSupabase({
  user = { id: 'user-123' },
  insertError = null,
  uploadError = null,
}: {
  user?: { id: string } | null;
  insertError?: unknown;
  uploadError?: unknown;
} = {}) {
  const insert = vi.fn().mockResolvedValue({ error: insertError });
  const upload = vi.fn().mockResolvedValue({ error: uploadError });
  const remove = vi.fn().mockResolvedValue({ error: null });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn(() => ({ insert })),
    storage: {
      from: vi.fn(() => ({ upload, remove })),
    },
  };

  createClientMock.mockResolvedValue(supabase as never);

  return { supabase, insert, upload, remove };
}

describe('createTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('transaction-uuid');
  });

  it('returns a validation error when merchant name is missing', async () => {
    mockSupabase();
    const formData = createFormData({ merchantName: '   ' });

    const result = await createTransaction(null, formData);

    expect(result).toEqual({ success: false, error: 'Merchant name is required.' });
  });

  it('inserts a manual GBP transaction and redirects to the GBP tab', async () => {
    const { insert } = mockSupabase();

    await expect(createTransaction(null, createFormData())).rejects.toThrow('NEXT_REDIRECT:/transactions?tab=GBP');

    expect(insert).toHaveBeenCalledWith({
      user_id: 'user-123',
      transaction_id: 'manual_user-123_transaction-uuid',
      merchant_name: 'Pret A Manger',
      amount: 12.5,
      currency: 'GBP',
      local_amount: 12.5,
      local_currency: 'GBP',
      krw_amount: null,
      exchange_rate: null,
      status: 'Approved',
      source: 'manual',
      account_type: 'GBP',
      is_estimated_rate: false,
      category: 'Food',
      receipt_url: null,
      transacted_at: '2026-08-19T09:30',
    });
    expect(revalidatePathMock).toHaveBeenCalledWith('/transactions');
    expect(redirectMock).toHaveBeenCalledWith('/transactions?tab=GBP');
  });

  it('uploads an optional receipt image and stores its path with the transaction', async () => {
    const { insert, upload } = mockSupabase();
    const receipt = new File(['receipt'], 'receipt.png', { type: 'image/png' });
    const formData = createFormData({ receipt });

    await expect(createTransaction(null, formData)).rejects.toThrow('NEXT_REDIRECT:/transactions?tab=GBP');

    expect(upload).toHaveBeenCalledWith('user-123/transaction-uuid.png', receipt, { upsert: undefined });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      receipt_url: 'user-123/transaction-uuid.png',
    }));
  });

  it('removes an uploaded receipt when inserting the transaction fails', async () => {
    const { remove } = mockSupabase({ insertError: new Error('insert failed') });
    const receipt = new File(['receipt'], 'receipt.png', { type: 'image/png' });
    const formData = createFormData({ receipt });

    const result = await createTransaction(null, formData);

    expect(remove).toHaveBeenCalledWith(['user-123/transaction-uuid.png']);
    expect(result).toEqual({ success: false, error: 'Failed to create transaction.' });
  });
});
