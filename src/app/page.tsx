import { DM_Serif_Display } from 'next/font/google';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const serif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
});

export default function Home() {
  return (
    <div className={`${serif.variable} min-h-screen bg-slate-50`}>
      {/* Nav */}
      <nav className="max-w-3xl mx-auto px-6 py-5">
        <span className="text-sm font-medium text-slate-900 tracking-tight">
          Smart Money Tracker
        </span>
      </nav>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-20">
        <div className="space-y-5">
          <p className="text-xs font-medium text-slate-400 tracking-widest uppercase">
            Personal Finance
          </p>
          <h1
            className="text-5xl sm:text-[64px] text-slate-900 leading-[1.1] tracking-tight"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Your money,
            <br />
            finally understood.
          </h1>
          <p className="text-lg text-slate-500 max-w-sm leading-relaxed">
            Connect your Bank account and get a clear picture of where every
            penny goes — across currencies and time.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link href="/login">
              <Button size="lg" className="px-8">
                Get started
              </Button>
            </Link>
          </div>
        </div>

        {/* Mini dashboard preview */}
        <div className="mt-16 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 mb-1">
                This month&apos;s spending
              </p>
              <p className="text-2xl font-semibold text-slate-900 tabular-nums">
                £1,284.50
              </p>
            </div>
            <div className="flex gap-1">
              {['Daily', 'Weekly', 'Monthly'].map((p, i) => (
                <span
                  key={p}
                  className={`text-xs px-2.5 py-1 rounded-md ${i === 2 ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="px-6 py-4 space-y-3">
            {[
              { merchant: 'Tesco Express', amount: '-£12.40', date: 'Today' },
              {
                merchant: 'Transport for London',
                amount: '-£4.80',
                date: 'Yesterday',
              },
              {
                merchant: 'Monzo Pot Transfer',
                amount: '-£200.00',
                date: '01 Mar',
              },
              { merchant: 'Pret A Manger', amount: '-£7.25', date: '01 Mar' },
            ].map((tx) => (
              <div
                key={tx.merchant}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                  <span className="text-sm text-slate-700">{tx.merchant}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-800 tabular-nums">
                    {tx.amount}
                  </p>
                  <p className="text-xs text-slate-400">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Automatic sync',
              desc: 'Transactions imported from Monzo in real time. No manual entry ever.',
              icon: (
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                  />
                </svg>
              ),
            },
            {
              title: 'Multi-currency',
              desc: 'Track spending in GBP, EUR, KRW and more with estimated exchange rates.',
              icon: (
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253"
                  />
                </svg>
              ),
            },
            {
              title: 'Spending insights',
              desc: 'Daily, weekly, and monthly charts so you always know where your money went.',
              icon: (
                <svg
                  className="w-5 h-5 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
              ),
            },
          ].map(({ title, desc, icon }) => (
            <div
              key={title}
              className="bg-white rounded-xl border border-slate-100 p-6 space-y-3"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                {icon}
              </div>
              <h3 className="font-medium text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-6 py-5 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} Smart Money Tracker
        </p>
      </footer>
    </div>
  );
}
