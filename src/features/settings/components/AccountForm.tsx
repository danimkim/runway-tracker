'use client';

import { useActionState } from 'react';
import { updateAccountBalances } from '@/features/settings/actions/account';

interface AccountField {
  flag: string;
  label: string;
  name: string;
  prefix: string;
  current: string;
  defaultValue: string;
  step: string;
}

interface AccountFormProps {
  accountFields: AccountField[];
}

export function AccountForm({ accountFields }: AccountFormProps) {
  const [state, formAction, isPending] = useActionState(updateAccountBalances, null);

  const btnClass = state?.success ? 'btn-primary transition-colors duration-300 !bg-emerald-500' : 'btn-primary';

  return (
    <form action={formAction} className="px-5 pt-5 pb-25 flex flex-col gap-4">
      {accountFields.map((acc) => (
        <div key={acc.name} className="bg-card rounded-item p-4 shadow-card">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <span>{acc.flag}</span>
              <span className="text-sm font-semibold text-primary">{acc.label}</span>
            </div>
            <span className="text-[13px] text-faint">{acc.current}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-semibold text-accent">{acc.prefix}</span>
            <input
              className="field-input"
              type="number"
              name={acc.name}
              defaultValue={acc.defaultValue}
              step={acc.step}
              min="0"
            />
          </div>
        </div>
      ))}

      <div className="bg-warning-bg rounded-xl px-3.5 py-3 flex gap-2">
        <span>⚠️</span>
        <p className="text-xs text-warning-text leading-normal">
          Manually editing balances will affect reverse-calculation accuracy.
        </p>
      </div>

      {state?.success === false && <p className="text-sm text-red-500 text-center">{state.error}</p>}

      <button type="submit" disabled={isPending} className={btnClass}>
        {isPending ? 'Saving...' : state?.success ? 'Saved!' : 'Save'}
      </button>
    </form>
  );
}
