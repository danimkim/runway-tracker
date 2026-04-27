import { toLocalDateStr } from "./formatter";

export default function getWeeklySpending(transactions: { transacted_at: string; amount: number | null }[]) {
  const today = new Date();
  return Array.from({ length: 5 }, (_, i) => {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() - (4 - i) * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const startStr = toLocalDateStr(weekStart);
    const endStr = toLocalDateStr(weekEnd);

    const amount = transactions
      .filter((t) => t.transacted_at >= startStr && t.transacted_at <= endStr)
      .reduce((s, t) => s + (t.amount ?? 0), 0);

    return { label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`, amount };
  });
}
