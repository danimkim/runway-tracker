import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { searchMerchantNames } from '@/features/transactions/actions/search-merchant-names';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

const createClientMock = vi.mocked(createClient);

describe('searchMerchantNames', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns no suggestions without an authenticated user', async () => {
    const rpc = vi.fn();
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      rpc,
    } as never);

    expect(await searchMerchantNames('Pret')).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('searches the signed-in user’s merchant names and returns suggestions', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [{ merchant_name: 'Pret A Manger' }],
      error: null,
    });
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      rpc,
    } as never);

    expect(await searchMerchantNames('  Pret  ')).toEqual(['Pret A Manger']);
    expect(rpc).toHaveBeenCalledWith('search_merchant_names', {
      search_text: 'Pret',
      max_results: 5,
    });
  });

  it('does not block editing when the lookup fails', async () => {
    createClientMock.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      rpc: vi.fn().mockResolvedValue({ data: null, error: new Error('query failed') }),
    } as never);

    expect(await searchMerchantNames('Pret')).toEqual([]);
  });
});
