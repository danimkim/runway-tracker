'use client';

import { useActionState } from 'react';
import { CATEGORY_EMOJI, CATEGORY_NAMES } from '@/lib/categories';
import { createTransaction } from '@/features/transactions/actions/create-transaction';

interface CreateTransactionFormProps {
  defaultDate: string;
}

export function CreateTransactionForm({ defaultDate }: CreateTransactionFormProps) {
  const [state, formAction, isPending] = useActionState(createTransaction, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 p-5 pb-24">
      <div className="bg-card rounded-item p-4 shadow-card">
        <label className="field-label" htmlFor="merchantName">
          Merchant
        </label>
        <input
          id="merchantName"
          name="merchantName"
          className="field-input"
          placeholder="Pret A Manger"
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
            placeholder="12.50"
            required
          />
        </div>
      </div>

      <div className="bg-card rounded-item p-4 shadow-card">
        <label className="field-label" htmlFor="transactedAt">
          Date
        </label>
        <input
          id="transactedAt"
          name="transactedAt"
          className="field-input"
          type="date"
          defaultValue={defaultDate}
          required
        />
      </div>

      <div className="bg-card rounded-item p-4 shadow-card">
        <label className="field-label" htmlFor="category">
          Category
        </label>
        <select id="category" name="category" className="field-input" defaultValue="">
          <option value="">Uncategorized</option>
          {CATEGORY_NAMES.map((category) => (
            <option key={category} value={category}>
              {CATEGORY_EMOJI[category]} {category}
            </option>
          ))}
        </select>
      </div>

      {state?.success === false && <p className="text-sm text-red-500 text-center">{state.error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Creating...' : 'Create transaction'}
      </button>
    </form>
  );
}
