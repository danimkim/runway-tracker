import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreateTransactionForm } from '@/features/transactions/components/CreateTransactionForm';
import { RECEIPT_ACCEPT } from '@/features/transactions/utils/receipt-upload';

vi.mock('@/features/transactions/actions/create-transaction', () => ({
  createTransaction: vi.fn(),
}));

describe('CreateTransactionForm', () => {
  it('renders the fields needed to create a transaction', () => {
    render(<CreateTransactionForm defaultDate="2026-08-19" />);

    expect(screen.getByLabelText('Merchant')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('Date and time')).toHaveAttribute('type', 'datetime-local');
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create transaction' })).toBeEnabled();
  });

  it('normalizes a date-only default value for the date-time input', () => {
    render(<CreateTransactionForm defaultDate="2026-08-19" />);

    expect(screen.getByLabelText('Date and time')).toHaveValue('2026-08-19T12:00');
  });

  it('trims an ISO default value for the date-time input', () => {
    render(<CreateTransactionForm defaultDate="2026-08-19T09:30:00Z" />);

    expect(screen.getByLabelText('Date and time')).toHaveValue('2026-08-19T09:30');
  });

  it('renders an optional receipt image input with the allowed file types', () => {
    render(<CreateTransactionForm defaultDate="2026-08-19" />);

    const receiptInput = screen.getByLabelText('Receipt image');

    expect(receiptInput).toHaveAttribute('type', 'file');
    expect(receiptInput).toHaveAttribute('name', 'receipt');
    expect(receiptInput).toHaveAttribute('accept', RECEIPT_ACCEPT);
    expect(screen.getByText('JPEG, PNG, WebP, or HEIC up to 10MB.')).toBeInTheDocument();
  });
});
