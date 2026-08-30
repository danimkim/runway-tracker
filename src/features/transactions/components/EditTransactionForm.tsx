'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { CATEGORY_EMOJI, CATEGORY_NAMES } from '@/lib/categories';
import { updateTransaction } from '@/features/transactions/actions/update-transaction';
import type { TxDetail } from '@/features/transactions/data/transactions';

interface EditTransactionFormProps {
  transaction: TxDetail;
}

function toDateTimeLocalValue(date: string | null) {
  if (!date) return '';
  if (date.includes('T')) return date.slice(0, 16);
  return `${date}T12:00`;
}

export function EditTransactionForm({ transaction }: EditTransactionFormProps) {
  const [state, formAction, isPending] = useActionState(updateTransaction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-5 pb-24">
      <input type="hidden" name="id" value={transaction.id} />

      <div className="bg-card rounded-item p-4 shadow-card">
        <label className="field-label" htmlFor="merchantName">
          Merchant
        </label>
        <input
          id="merchantName"
          name="merchantName"
          className="field-input"
          defaultValue={transaction.merchant_name ?? ''}
          required
        />
      </div>

      <div className="bg-card rounded-item p-4 shadow-card">
        <label className="field-label" htmlFor="amount">
          Amount
        </label>
        <div className="relative">
          <span className="field-prefix">£</span>
          <input
            id="amount"
            name="amount"
            className="field-input pl-8"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            defaultValue={transaction.amount ?? ''}
            required
          />
        </div>
      </div>

      <div className="bg-card rounded-item p-4 shadow-card">
        <label className="field-label" htmlFor="transactedAt">
          Date and time
        </label>
        <input
          id="transactedAt"
          name="transactedAt"
          className="field-input"
          type="datetime-local"
          defaultValue={toDateTimeLocalValue(transaction.transacted_at)}
          required
        />
      </div>

      <div className="bg-card rounded-item p-4 shadow-card">
        <label className="field-label" htmlFor="category">
          Category
        </label>
        <select id="category" name="category" className="field-input" defaultValue={transaction.category ?? ''}>
          <option value="">Uncategorized</option>
          {CATEGORY_NAMES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_EMOJI[category]} {category}
            </option>
          ))}
        </select>
      </div>

      {state?.success === false ? <p className="text-sm text-red-500 text-center">{state.error}</p> : null}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Saving...' : 'Save'}
      </button>
      <Link href={`/transactions/${transaction.id}`} className="btn-secondary no-underline text-center">
        Cancel
      </Link>
    </form>
  );
}
