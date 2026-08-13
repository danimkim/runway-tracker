import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_COLORS, CATEGORY_EMOJI, CategoryName, isCategoryName } from '@/lib/categories';
import { getGBPTransactions, getKRWTransactions } from '@/features/transactions/data/transactions';
import { groupByDate } from '@/features/transactions/utils/grouping';

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'GBP' } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const txs = tab === 'GBP' ? await getGBPTransactions(user.id) : await getKRWTransactions(user.id);

  const total = txs.reduce((s, t) => s + (t.amount ?? 0), 0);
  const grouped = groupByDate(txs);

  return (
    <div className="screen has-bottom-nav overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-border pt-14 px-5">
        <h1 className="text-[22px] font-bold text-primary mb-[14px]">Transactions</h1>
        <div className="flex bg-surface rounded-btn p-[3px] mb-4">
          {(['GBP', 'KRW'] as const).map((t) => (
            <Link
              key={t}
              href={`/transactions?tab=${t}`}
              className={`flex-1 font-semibold text-sm text-center no-underline block py-2 rounded-[10px] ${
                tab === t
                  ? 'bg-white text-(--color-primary) shadow-[0_1px_4px_rgba(59,66,78,0.1)]'
                  : 'bg-transparent text-muted'
              }`}
            >
              {t === 'GBP' ? '🇬🇧 GBP' : '🇰🇷 KRW'}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col pt-4 px-5 pb-[120px] gap-4">
        {/* Total card */}
        <div className="bg-white flex justify-between items-center rounded-item py-[14px] px-4 shadow-(--shadow-card)">
          <div>
            <p className="text-xs text-muted font-medium">This month</p>
            <p className="text-[20px] font-bold text-primary mt-0.5">
              {tab === 'GBP' ? `£${total.toFixed(2)}` : `₩${total.toLocaleString()}`}
            </p>
          </div>
          <Link
            href="/upload"
            className="bg-accent text-white font-semibold text-[13px] no-underline rounded-[10px] py-2 px-[14px]"
          >
            Upload PDF
          </Link>
        </div>

        {/* Grouped transactions */}
        {grouped.map(([date, dayTxs]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-muted mb-2">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', day: 'numeric' })}
            </p>
            <div className="bg-white overflow-hidden rounded-item shadow-(--shadow-card)">
              {dayTxs.map((tx, i) => {
                const cat = isCategoryName(tx.category ?? '') ? (tx.category as CategoryName) : null;
                const catColor = cat ? CATEGORY_COLORS[cat] : null;

                const inner = (
                  <>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center text-base shrink-0 w-[38px] h-[38px] rounded-btn"
                        style={{ background: catColor ? catColor + '22' : 'var(--color-warning-bg)' }}
                      >
                        {cat ? CATEGORY_EMOJI[cat] : '❓'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">{tx.merchant}</p>
                        <span
                          className="text-[11px] font-semibold rounded-badge py-[2px] px-[7px]"
                          style={{
                            color: catColor ?? 'var(--color-warning)',
                            background: catColor ? catColor + '22' : 'var(--color-warning-bg)',
                          }}
                        >
                          {tx.category ?? 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{tx.displayAmount}</p>
                      {tx.linkable && (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-1 stroke-light">
                          <path d="M5 3l4 4-4 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </>
                );

                const rowClass = `py-[13px] px-4 flex justify-between items-center${
                  i < dayTxs.length - 1 ? ' border-b border-subtle' : ''
                }`;

                return tx.linkable ? (
                  <Link key={tx.id} href={`/transactions/${tx.id}`} className={`${rowClass} no-underline`}>
                    {inner}
                  </Link>
                ) : (
                  <div key={tx.id} className={rowClass}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {txs.length === 0 && (
          <div className="text-center text-faint py-12">
            <p className="text-[32px] mb-2">📭</p>
            <p className="text-sm">No transactions yet</p>
          </div>
        )}
      </div>

      <Link
        href="/upload"
        aria-label="Upload transactions"
        className="fixed right-[max(20px,calc((100vw-430px)/2+20px))] bottom-23 z-90 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(59,66,78,0.22)] transition-colors hover:bg-accent-hover"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
