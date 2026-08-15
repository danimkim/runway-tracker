import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { logout } from '@/features/settings/actions/session';
import { ChangePasswordModal } from '@/features/settings/components/ChangePasswordModal';
import { getSettingsOverview } from '@/features/settings/data/settings';
import { getDaysLeft } from '@/features/settings/utils/date';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { krwBalance, gbpBalance, targetDate } = await getSettingsOverview(user!.id, supabase);
  const daysLeft = targetDate ? getDaysLeft(targetDate) : null;

  const krwFormatted = `₩${krwBalance.toLocaleString()}`;
  const gbpFormatted = `£${gbpBalance.toFixed(2)}`;
  const goalSub = targetDate && daysLeft !== null ? `${targetDate} · D-${daysLeft}` : '—';

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
    <div className="screen has-bottom-nav overflow-y-auto">
      {/* Header */}
      <div className="pt-14 px-5 pb-4 bg-card border-b border-surface">
        <div className="flex justify-between items-center">
          <h1 className="text-[22px] font-bold text-primary">Settings</h1>
          <button className="bg-surface border-none rounded-lg py-[5px] px-[10px] text-xs font-bold text-secondary cursor-pointer [font-family:inherit]">
            한국어
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-[120px] flex flex-col gap-4">
        {/* Profile card */}
        <div className="bg-card rounded-card p-5 shadow-card">
          <div className="flex items-center gap-[14px]">
            <div className="w-[50px] h-[50px] rounded-[18px] bg-gradient-to-br from-muted to-light flex items-center justify-center text-xl text-white font-bold shrink-0">
              {avatar}
            </div>
            <div>
              <p className="text-[15px] font-bold text-primary">{user?.email}</p>
              <p className="text-xs text-muted mt-0.5">Solo Plan</p>
            </div>
          </div>
        </div>

        {/* ACCOUNTS section */}
        <div>
          <p className="text-xs font-semibold text-muted mb-2 pl-1 tracking-[0.5px] uppercase">Bank Accounts</p>
          <div className="bg-card rounded-item overflow-hidden shadow-card divide-y divide-subtle">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href} className="no-underline block">
                <div className="flex items-center gap-[14px] px-4 py-[15px]">
                  <div className="w-[38px] h-[38px] rounded-btn bg-surface flex items-center justify-center text-lg shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-semibold text-primary">{item.label}</p>
                    <p className="text-xs text-muted mt-px">{item.sub}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 4l4 4-4 4"
                      stroke="var(--color-light)"
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

        {/* Transactions */}
        <div>
          <p className="text-xs font-semibold text-muted mb-2 pl-1 tracking-[0.5px] uppercase">Transactions</p>
          <div className="bg-card rounded-item overflow-hidden shadow-card">
            <div className="flex items-center gap-[14px] px-4 py-[15px]">
              <div className="w-[38px] h-[38px] rounded-btn bg-surface flex items-center justify-center text-lg shrink-0">
                🔄
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-primary">Reset</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-card rounded-item overflow-hidden shadow-card">
          <div className="flex items-center gap-[14px] px-4 py-[15px]">
            <div className="w-[38px] h-[38px] rounded-btn bg-surface flex items-center justify-center text-lg shrink-0">
              💬
            </div>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-primary">Contact</p>
              <p className="text-xs text-muted mt-px">danimkim.dev@gmail.com</p>
            </div>
          </div>
        </div>

        {/* SECURITY section */}
        <div>
          <p className="text-xs font-semibold text-muted mb-2 pl-1 tracking-[0.5px] uppercase">Security</p>
          <div className="bg-card rounded-item overflow-hidden shadow-card">
            <ChangePasswordModal userEmail={user!.email!} />
          </div>
        </div>

        {/* Log Out */}
        <div className="bg-card rounded-item overflow-hidden shadow-card">
          <form action={logout}>
            <button type="submit" className="w-full bg-transparent border-none cursor-pointer [font-family:inherit]">
              <div className="flex items-center gap-[14px] px-4 py-[15px]">
                <div className="w-[38px] h-[38px] rounded-btn bg-warning-bg flex items-center justify-center text-lg shrink-0">
                  🚪
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[15px] font-semibold text-warning">Log Out</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="var(--color-warning)"
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
