import { createClient } from '@/lib/supabase/server';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { updateAccountBalances } from './actions';

export default async function ManageAccountsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: accounts } = await supabase
    .from('accounts')
    .select('currency, balance')
    .eq('user_id', user!.id);

  const krwBalance = accounts?.find((a) => a.currency === 'KRW')?.balance ?? 0;
  const gbpBalance = accounts?.find((a) => a.currency === 'GBP')?.balance ?? 0;

  const accountFields = [
    {
      flag: '🇰🇷',
      label: 'Korean Won (KRW)',
      name: 'krwBalance',
      prefix: '₩',
      current: `Current ₩${krwBalance.toLocaleString()}`,
      defaultValue: String(krwBalance),
      step: '1',
    },
    {
      flag: '🇬🇧',
      label: 'British Pound (GBP)',
      name: 'gbpBalance',
      prefix: '£',
      current: `Current £${gbpBalance.toFixed(2)}`,
      defaultValue: String(gbpBalance),
      step: '0.01',
    },
  ];

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Manage Accounts" backHref="/settings" />

      <form
        action={updateAccountBalances}
        className="px-5 pt-5 pb-[100px] flex flex-col gap-4"
      >
        {accountFields.map((acc) => (
          <div
            key={acc.name}
            className="bg-card rounded-item p-4 shadow-card"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <span>{acc.flag}</span>
                <span className="text-sm font-semibold text-primary">
                  {acc.label}
                </span>
              </div>
              <span className="text-[13px] text-faint">{acc.current}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-semibold text-accent">
                {acc.prefix}
              </span>
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

        <div className="bg-warning-bg rounded-xl px-[14px] py-3 flex gap-2">
          <span>⚠️</span>
          <p className="text-xs text-warning-text leading-[1.5]">
            Manually editing balances will affect reverse-calculation accuracy.
          </p>
        </div>

        <button type="submit" className="btn-primary">
          Save
        </button>
      </form>
    </div>
  );
}
