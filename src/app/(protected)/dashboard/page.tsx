import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { calcRunway } from '@/lib/runway';
import { calcActualGBPBalance, calcActualKRWBalance } from '@/lib/balance';
import { getExchangeRate } from '@/lib/exchange-rate';
import AccountCard from '@/features/dashboard/components/AccountCard';
import { formatGBP, formatKRW } from '@/features/dashboard/utils/formatter';
import WeeklyBarChart from '@/features/dashboard/components/WeekilyBarChart';
import getWeeklySpending from '@/features/dashboard/utils/calculate-weekly-spending';
import MonthlySpendingChart from '@/features/dashboard/components/MonthlySpendingChart';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: settings }, { data: accounts }, { data: exchangeRecords }, { data: transactions }] = await Promise.all(
    [
      supabase.from('user_settings').select('*').eq('user_id', user.id).single(),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('exchange_records').select('gbp_in, krw_out').eq('user_id', user.id),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'Approved')
        .order('transacted_at', { ascending: false }),
    ],
  );

  const krwAccount = accounts?.find((a) => a.currency === 'KRW');
  const gbpAccount = accounts?.find((a) => a.currency === 'GBP');
  const totalGbpIn = exchangeRecords?.reduce((s, r) => s + r.gbp_in, 0) ?? 0;
  const totalKrwOut = exchangeRecords?.reduce((s, r) => s + r.krw_out, 0) ?? 0;
  const totalGbpTransactions = transactions?.reduce((s, t) => s + t.amount, 0) ?? 0;

  const krwBalance = calcActualKRWBalance({
    initialBalance: krwAccount?.balance ?? 0,
    totalKrwOut,
  });
  const gbpBalance = calcActualGBPBalance({
    initialBalance: gbpAccount?.balance ?? 0,
    totalGbpIn,
    totalTransactions: totalGbpTransactions,
  });

  const targetDate = settings?.target_date ?? '';
  let exchangeRate = 0;
  let rateUnavailable = false;
  try {
    exchangeRate = await getExchangeRate(user.id);
  } catch {
    rateUnavailable = true;
  }

  const runway =
    targetDate && !rateUnavailable ? calcRunway({ krwBalance, gbpBalance, exchangeRate, targetDate }) : null;

  const thisMonthPrefix = new Date().toISOString().slice(0, 7);
  const thisMonthTransactions = (transactions ?? []).filter((t) => t.transacted_at?.startsWith(thisMonthPrefix));
  const monthTotal = thisMonthTransactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const monthTotalKRW = Math.round(monthTotal * exchangeRate);

  const dayOfMonth = new Date().getDate();
  const actualDailyKRW = thisMonthTransactions.length > 0 ? Math.round((monthTotal * exchangeRate) / dayOfMonth) : 0;
  /**
   * The difference between the recommended daily budget and the actual daily average
   * (Determines if the budget is exceeded: positive = over budget, negative = under budget)
   * If runway is null (exchange rate failure or target_date missing), 0
   */
  const budgetDiff = runway ? actualDailyKRW - runway.dailyBudgetKRW : 0;

  /**
   * "How many days early/late will it run out" estimation
   * @remarks
   * budgetDiff × daysLeft / dailyBudgetKRW
   */
  const daysEarlyLate =
    runway && runway.daysLeft > 0
      ? Math.abs(Math.round((budgetDiff * runway.daysLeft) / (runway.dailyBudgetKRW || 1))) // Prevent divide by zero when runway.dailyBudgetKRW is 0
      : 0;
  const isOver = budgetDiff > 0;
  const usedRatio = runway ? Math.min(1, monthTotalKRW / runway.totalKRW) : 0;

  const weeklySpending = getWeeklySpending(transactions ?? []);

  return (
    <div className="screen has-bottom-nav">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 bg-card border-b border-border">
        <p className="text-[13px] text-muted font-medium">
          {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-[26px] font-extrabold text-primary mt-0.5">Hello 👋</h1>
      </div>

      <div className="px-5 pt-5 pb-[120px] flex flex-col gap-5">
        {/* Exchange rate error banner */}
        {rateUnavailable && (
          <div className="bg-warning-bg rounded-btn px-3.5 py-3 flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <p className="text-[13px] text-warning-text">
              Exchange rate unavailable. Runway data is hidden until the rate is restored.
            </p>
          </div>
        )}

        {/* Account cards */}
        <div className="flex gap-2.5">
          {[
            { flag: '🇰🇷', label: 'Korean Won (KRW)', currency: 'KRW', amount: krwBalance, fmt: formatKRW },
            { flag: '🇬🇧', label: 'British Pound (GBP)', currency: 'GBP', amount: gbpBalance, fmt: formatGBP },
          ].map((acc) => (
            <AccountCard key={acc.currency} {...acc} />
          ))}
        </div>

        {/* Total Runway */}
        {runway && (
          <div className="runway-card rounded-card p-6 text-white">
            <p className="text-[11px] text-light font-medium tracking-wide uppercase">Total Runway (KRW)</p>
            <p className="text-[32px] font-extrabold mt-1 tracking-[-0.5px]">{formatKRW(runway.totalKRW)}</p>
            <p className="text-[12px] text-light/70 mt-1">£1 = ₩{exchangeRate.toLocaleString()} · Updated daily</p>
            {/* Progress bar */}
            <div className="mt-2">
              <div className="h-1.5 rounded-full overflow-hidden bg-white/15">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usedRatio * 100}%`,
                    background:
                      usedRatio > 0.8
                        ? 'linear-gradient(90deg,var(--color-warning),#E85C6A)'
                        : 'linear-gradient(90deg,var(--color-faint),#D4D9ED)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] text-light/70">{formatKRW(monthTotalKRW)}</span>
                <span className="text-[11px] text-light/50">{formatKRW(runway.totalKRW)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Runway Insights */}
        {runway && (
          <div className="bg-card rounded-card p-5 shadow-(--shadow-card)">
            <div className="flex justify-between items-center mb-3.5">
              <p className="text-sm font-semibold text-primary">Runway Insights</p>
              <div className="bg-surface rounded-lg px-2.5 py-1">
                <span className="text-[13px] font-bold text-accent">D-{runway.daysLeft}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <div className="bg-subtle rounded-btn p-3">
                <p className="text-[11px] text-muted font-medium">Daily Budget</p>
                <p className="text-base font-bold text-primary mt-[3px]">{formatKRW(runway.dailyBudgetKRW)}</p>
                <p className="text-[11px] text-faint mt-0.5">≈ £{runway.dailyBudgetGBP}/day</p>
              </div>
              <div className="bg-subtle rounded-btn p-3">
                <p className="text-[11px] text-muted font-medium">30-day Average</p>
                <p className={`text-base font-bold mt-[3px] ${isOver ? 'text-warning' : 'text-primary'}`}>
                  {formatKRW(actualDailyKRW)}
                </p>
                <p className="text-[11px] text-faint mt-0.5">Actual spend/day</p>
              </div>
            </div>
            <div
              className={`rounded-btn px-3.5 py-3 flex items-center gap-2.5 ${isOver ? 'bg-warning-bg' : 'bg-success-bg'}`}
            >
              <span className="text-lg">{isOver ? '⚠️' : '✅'}</span>
              <p className={`text-[13px] leading-[1.4] ${isOver ? 'text-warning-text' : 'text-success-text'}`}>
                {isOver
                  ? `You're ${daysEarlyLate} day${daysEarlyLate !== 1 ? 's' : ''} over budget`
                  : `You're on track with ${daysEarlyLate} day${daysEarlyLate !== 1 ? 's' : ''} to spare`}
              </p>
            </div>
          </div>
        )}

        {/* Monthly Spending */}
        <MonthlySpendingChart transactions={transactions ?? []} exchangeRate={exchangeRate} />

        {/* Weekly Spending */}
        <div className="bg-card rounded-card p-5 shadow-(--shadow-card)">
          <p className="text-[17px] font-bold text-primary mb-3.5">Weekly Spending</p>
          <WeeklyBarChart data={weeklySpending} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <a href="/upload" className="quick-action-btn">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none" className="mb-2">
              <rect x="4" y="2" width="14" height="18" rx="3" stroke="#8991B2" strokeWidth="1.7" />
              <path d="M8 7h6M8 10h6M8 13h4" stroke="#8991B2" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="17" cy="17" r="4.5" fill="#3B424E" />
              <path d="M17 15v4M15 17h4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span>Upload PDF</span>
          </a>
          <a href="/exchange" className="quick-action-btn">
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none" className="mb-2">
              <path
                d="M4 8h14M4 8l3-3M4 8l3 3"
                stroke="#8991B2"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18 14H4M18 14l-3-3M18 14l-3 3"
                stroke="#8991B2"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Log Exchange</span>
          </a>
        </div>
      </div>
    </div>
  );
}
