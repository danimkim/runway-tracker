'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteTransaction } from '@/features/transactions/actions/delete-transaction';

interface DeleteTransactionButtonProps {
  transactionId: string;
}

function ConfirmDeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 py-2.5 rounded-lg bg-warning text-[13px] font-semibold text-white disabled:opacity-60"
    >
      {pending ? 'Deleting...' : 'Delete'}
    </button>
  );
}

export function DeleteTransactionButton({ transactionId }: DeleteTransactionButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="btn-warning"
      >
        Delete
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-[280px] shadow-lg">
            <p className="text-[15px] font-semibold text-primary mb-1.5">Delete Transaction</p>
            <p className="text-[13px] text-secondary mb-5">
              This transaction will be permanently deleted. Are you sure?
            </p>
            <form action={deleteTransaction} className="flex gap-2">
              <input type="hidden" name="id" value={transactionId} />
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 text-[13px] font-semibold text-secondary"
              >
                Cancel
              </button>
              <ConfirmDeleteButton />
            </form>
          </div>
        </div>
      )}
    </>
  );
}
