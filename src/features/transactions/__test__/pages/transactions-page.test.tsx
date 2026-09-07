import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TransactionsPage from '@/app/(protected)/transactions/page';
import { getGBPTransactions, getKRWTransactions } from '@/features/transactions/data/transactions';

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: 'user' } } }) } }),
}));
vi.mock('@/features/transactions/data/transactions', () => ({
  getGBPTransactions: vi.fn(),
  getKRWTransactions: vi.fn(),
}));

const transactions = [
  { id: '1', merchant: 'Current merchant', amount: 10, transacted_at: '2026-01-01' },
  { id: '2', merchant: 'Previous merchant', amount: 20, transacted_at: '2025-12-31' },
  { id: '3', merchant: 'Older merchant', amount: 30, transacted_at: '2025-01-01' },
  { id: '4', merchant: 'Undated merchant', amount: 40, transacted_at: null },
].map((tx) => ({ ...tx, category: null, displayAmount: `amount ${tx.amount}`, linkable: false }));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-01-31T12:00:00Z'));
  vi.mocked(getGBPTransactions).mockResolvedValue(transactions);
  vi.mocked(getKRWTransactions).mockResolvedValue(transactions);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('transaction period', () => {
  it('defaults to current month for both the total and list', async () => {
    vi.mocked(getGBPTransactions).mockResolvedValue([transactions[0]]);
    render(await TransactionsPage({ searchParams: Promise.resolve({}) }));
    expect(getGBPTransactions).toHaveBeenCalledWith('user', { start: '2026-01-01', end: '2026-02-01' });
    expect(screen.getByText('£10.00')).toBeInTheDocument();
    expect(screen.getByText('Current merchant')).toBeInTheDocument();
    expect(screen.queryByText('Previous merchant')).not.toBeInTheDocument();
    expect(screen.queryByText('Older merchant')).not.toBeInTheDocument();
    expect(screen.queryByText('Undated merchant')).not.toBeInTheDocument();
  });

  it('handles last month across years and preserves the period when switching currency', async () => {
    vi.mocked(getKRWTransactions).mockResolvedValue([transactions[1]]);
    render(await TransactionsPage({ searchParams: Promise.resolve({ tab: 'KRW', period: 'last-month' }) }));
    expect(getKRWTransactions).toHaveBeenCalledWith('user', { start: '2025-12-01', end: '2026-01-01' });
    expect(screen.getByText('₩20')).toBeInTheDocument();
    expect(screen.getByText('Previous merchant')).toBeInTheDocument();
    expect(screen.queryByText('Current merchant')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '🇬🇧 GBP' })).toHaveAttribute(
      'href', '/transactions?tab=GBP&period=last-month',
    );
  });

  it('includes all dates and amounts for all time', async () => {
    render(await TransactionsPage({ searchParams: Promise.resolve({ period: 'all' }) }));
    expect(screen.getByText('£100.00')).toBeInTheDocument();
    for (const tx of transactions) expect(screen.getByText(tx.merchant)).toBeInTheDocument();
  });

  it('falls back to this month for an invalid period and shows an empty state', async () => {
    vi.mocked(getGBPTransactions).mockResolvedValue([]);
    render(await TransactionsPage({ searchParams: Promise.resolve({ period: 'invalid' }) }));
    expect(screen.getByText('£0.00')).toBeInTheDocument();
    expect(screen.getByText('No transactions for this period')).toBeInTheDocument();
    expect(screen.queryByText('Previous merchant')).not.toBeInTheDocument();
  });
});
