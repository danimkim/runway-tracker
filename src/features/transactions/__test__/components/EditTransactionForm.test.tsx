import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditTransactionForm } from '@/features/transactions/components/EditTransactionForm';

vi.mock('@/features/transactions/actions/update-transaction', () => ({
  updateTransaction: vi.fn(),
}));

describe('EditTransactionForm', () => {
  it('uses the shared merchant autocomplete with the current merchant', () => {
    render(<EditTransactionForm transaction={{
      id: 'transaction-1',
      merchant_name: 'Pret A Manger',
      amount: 12.5,
      transacted_at: '2026-08-19T09:30:00Z',
      category: 'Food',
      receipt_url: null,
    }} />);

    expect(screen.getByRole('combobox', { name: 'Merchant' })).toHaveValue('Pret A Manger');
    expect(screen.getByRole('combobox', { name: 'Merchant' })).toHaveAttribute('name', 'merchantName');
  });
});
