import { createClient } from '@/lib/supabase/server';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { AccountForm } from './AccountForm';

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
      <AccountForm accountFields={accountFields} />
    </div>
  );
}
