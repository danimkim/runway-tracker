import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from '@/lib/supabase/server';
import { getGBPTransactions, getKRWTransactions } from '@/features/transactions/data/transactions';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

function mockDatabase(cap = 1000, failAt?: number) {
  const rows = Array.from({ length: 1001 }, (_, i) => ({
    id: String(i), amount: 1, krw_out: 100, merchant_name: 'Shop', category: null,
    transacted_at: '2026-01-01T00:00:00Z', exchanged_at: '2026-01-01',
  }));
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), gte: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(),
    range: vi.fn(async (from: number, to: number) => from === failAt
      ? { data: null, error: { message: 'Database unavailable' } }
      : { data: rows.slice(from, Math.min(to + 1, from + cap)), error: null }),
  };
  vi.mocked(createClient).mockResolvedValue({ from: vi.fn(() => query) } as unknown as Awaited<ReturnType<typeof createClient>>);
  return query;
}

beforeEach(() => vi.clearAllMocks());

describe.each([
  { currency: 'GBP', fetch: getGBPTransactions, column: 'transacted_at', suffix: 'T00:00:00Z' },
  { currency: 'KRW', fetch: getKRWTransactions, column: 'exchanged_at', suffix: '' },
])('$currency queries', ({ fetch, column, suffix }) => {
  it('applies inclusive start and exclusive end in the database', async () => {
    const query = mockDatabase();
    await fetch('user', { start: '2026-01-01', end: '2026-02-01' });
    expect(query.gte).toHaveBeenCalledWith(column, `2026-01-01${suffix}`);
    expect(query.lt).toHaveBeenCalledWith(column, `2026-02-01${suffix}`);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user');
    expect(query.order).toHaveBeenCalledWith('id', { ascending: false });
  });

  it.each([1000, 200])('retrieves all 1,001 rows with a server cap of %i', async (cap) => {
    const query = mockDatabase(cap);
    const result = await fetch('user');
    expect(result).toHaveLength(1001);
    expect(new Set(result.map((row) => row.id)).size).toBe(1001);
    expect(result.reduce((sum, row) => sum + (row.amount ?? 0), 0)).toBe(suffix ? 1001 : 100100);
    expect(query.gte).not.toHaveBeenCalled();
    expect(query.lt).not.toHaveBeenCalled();
  });

  it.each([0, 1000])('throws on failure at offset %i instead of returning empty or partial data', async (offset) => {
    mockDatabase(1000, offset);
    await expect(fetch('user')).rejects.toThrow('Failed to load transactions.');
  });

  it('returns an empty list for a successful empty response', async () => {
    const query = mockDatabase();
    query.range.mockResolvedValue({ data: [], error: null });
    await expect(fetch('user')).resolves.toEqual([]);
  });
});
