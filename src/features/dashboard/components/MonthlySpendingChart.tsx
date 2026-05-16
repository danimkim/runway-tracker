'use client';

import { useState, useMemo } from 'react';
import { DonutChart } from '@/components/charts/DonutChart';
import { isCategoryName, CATEGORY_COLORS } from '@/lib/categories';
import { formatKRW } from '@/features/dashboard/utils/formatter';

interface Transaction {
  transacted_at: string | null;
  category: string | null;
  amount: number;
}

interface Props {
  transactions: Transaction[];
  exchangeRate: number;
}

export default function MonthlySpendingChart({ transactions, exchangeRate }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const availableMonths = useMemo(() => {
    const months = new Set(transactions.map((t) => t.transacted_at?.slice(0, 7)).filter(Boolean) as string[]);
    months.add(currentMonth);
    return Array.from(months).sort();
  }, [transactions, currentMonth]);

  const canGoPrev = selectedMonth > availableMonths[0];
  const canGoNext = selectedMonth < currentMonth;

  const goPrev = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx > 0) setSelectedMonth(availableMonths[idx - 1]);
  };

  const goNext = () => {
    const idx = availableMonths.indexOf(selectedMonth);
    if (idx < availableMonths.length - 1) setSelectedMonth(availableMonths[idx + 1]);
  };

  const filtered = transactions.filter((t) => t.transacted_at?.startsWith(selectedMonth));

  const catMap: Record<string, number> = {};
  filtered.forEach((t) => {
    const key = t.category ?? 'Uncategorized';
    catMap[key] = (catMap[key] ?? 0) + (t.amount ?? 0);
  });
  const catSegments = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const monthTotal = filtered.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const monthTotalKRW = Math.round(monthTotal * exchangeRate);

  const [year, month] = selectedMonth.split('-');
  const label = new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="bg-card rounded-card p-5 shadow-(--shadow-card)">
      <div className="flex items-center justify-between mb-3.5">
        <button
          onClick={goPrev}
          disabled={!canGoPrev}
          className="p-1.5 rounded-md text-muted disabled:opacity-30 transition-opacity"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-[17px] font-bold text-primary">{label}</p>
        <button
          onClick={goNext}
          disabled={!canGoNext}
          className="p-1.5 rounded-md text-muted disabled:opacity-30 transition-opacity"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-5">
        <DonutChart segments={catSegments} colors={CATEGORY_COLORS} size={120} />
        <div className="flex-1 flex flex-col gap-[7px]">
          {catSegments.length === 0 && <p className="text-xs text-faint">No transactions this month</p>}
          {catSegments.slice(0, 5).map((seg) => (
            <div key={seg.name} className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-[3px] shrink-0"
                  style={{ background: isCategoryName(seg.name) ? CATEGORY_COLORS[seg.name] : '#ccc' }}
                />
                <span className="text-xs text-secondary">{seg.name}</span>
              </div>
              <span className="text-xs font-semibold text-accent">£{seg.value.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border mt-3.5 pt-3 flex justify-between items-center">
        <span className="text-[13px] text-label">Total Spent</span>
        <div className="text-right">
          <span className="text-sm font-bold text-primary">£{monthTotal.toFixed(2)}</span>
          <span className="text-xs text-muted ml-1.5">≈ {formatKRW(monthTotalKRW)}</span>
        </div>
      </div>
    </div>
  );
}
