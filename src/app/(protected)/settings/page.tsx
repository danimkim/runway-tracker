import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/(protected)/settings/actions';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: accounts }, { data: settings }] = await Promise.all([
    supabase.from('accounts').select('currency, balance').eq('user_id', user!.id),
    supabase
      .from('user_settings')
      .select('target_date')
      .eq('user_id', user!.id)
      .single(),
  ]);

  const krwBalance = accounts?.find((a) => a.currency === 'KRW')?.balance ?? 0;
  const gbpBalance = accounts?.find((a) => a.currency === 'GBP')?.balance ?? 0;

  const targetDate = settings?.target_date ?? null;
  const daysLeft = targetDate
    ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86_400_000)
    : null;

  const krwFormatted = `₩${krwBalance.toLocaleString()}`;
  const gbpFormatted = `£${gbpBalance.toFixed(2)}`;
  const goalSub =
    targetDate && daysLeft !== null ? `${targetDate} · D-${daysLeft}` : '—';

  const avatar = user?.email?.[0]?.toUpperCase() ?? '?';

  const menuItems = [
    {
      icon: '🏦',
      label: 'Manage Accounts',
      sub: `KRW ${krwFormatted} · GBP ${gbpFormatted}`,
      href: '/settings/account',
    },
    {
      icon: '🎯',
      label: 'Goal Period',
      sub: goalSub,
      href: '/settings/goal',
    },
    {
      icon: '🔄',
      label: 'Log Exchange',
      sub: 'KRW → GBP transfer',
      href: '/exchange',
    },
    {
      icon: '🏷️',
      label: 'Categories',
      sub: 'Add, edit or delete categories',
      href: '/settings/categories',
    },
  ];

  return (
    <div className="screen has-bottom-nav" style={{ overflowY: 'auto' }}>
      {/* Header */}
      <div
        style={{
          padding: '56px 20px 16px',
          background: 'white',
          borderBottom: '1px solid #EEF0F8',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2A3140' }}>
            Settings
          </h1>
          <button
            style={{
              background: '#EEF0F8',
              border: 'none',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 12,
              fontWeight: 700,
              color: '#5A6478',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            한국어
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: '16px 20px 120px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Profile card */}
        <div
          style={{
            background: 'white',
            borderRadius: 20,
            padding: 20,
            boxShadow: '0 1px 4px rgba(59,66,78,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #8991B2, #B0B9D3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: 'white',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {avatar}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2A3140' }}>
                {user?.email}
              </p>
              <p style={{ fontSize: 12, color: '#8991B2', marginTop: 2 }}>
                Solo Plan
              </p>
            </div>
          </div>
        </div>

        {/* ACCOUNTS section */}
        <div>
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#8991B2',
              marginBottom: 8,
              paddingLeft: 4,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Accounts
          </p>
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(59,66,78,0.06)',
            }}
          >
            {menuItems.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '15px 16px',
                    borderBottom:
                      i < menuItems.length - 1
                        ? '1px solid #F5F6FA'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: '#EEF0F8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#2A3140',
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: '#8991B2',
                        marginTop: 1,
                      }}
                    >
                      {item.sub}
                    </p>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M6 4l4 4-4 4"
                      stroke="#B0B9D3"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Log Out */}
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(59,66,78,0.06)',
          }}
        >
          <form action={logout}>
            <button
              type="submit"
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '15px 16px',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: '#FFF0EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  🚪
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#E8845C',
                    }}
                  >
                    Log Out
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="#E8845C"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
