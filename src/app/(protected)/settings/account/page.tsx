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
    <div className="screen" style={{ overflowY: 'auto' }}>
      <SubPageHeader title="Manage Accounts" backHref="/settings" />

      <form
        action={updateAccountBalances}
        style={{
          padding: '20px 20px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {accountFields.map((acc) => (
          <div
            key={acc.name}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 16,
              boxShadow: '0 1px 4px rgba(59,66,78,0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{acc.flag}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#2A3140' }}>
                  {acc.label}
                </span>
              </div>
              <span style={{ fontSize: 13, color: '#AAB5C5' }}>{acc.current}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#3B424E' }}>
                {acc.prefix}
              </span>
              <input
                className="field-input"
                type="number"
                name={acc.name}
                defaultValue={acc.defaultValue}
                step={acc.step}
              />
            </div>
          </div>
        ))}

        <div
          style={{
            background: '#FFF8EE',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            gap: 8,
          }}
        >
          <span>⚠️</span>
          <p style={{ fontSize: 12, color: '#B07A30', lineHeight: '1.5' }}>
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
