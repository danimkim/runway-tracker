export interface RunwayInput {
  krwBalance: number;
  gbpBalance: number;
  exchangeRate: number;
  targetDate: string;
  today?: string;
}

export interface RunwayResult {
  totalKRW: number;
  daysLeft: number;
  dailyBudgetKRW: number;
  dailyBudgetGBP: number;
}

export function calcRunway({
  krwBalance,
  gbpBalance,
  exchangeRate,
  targetDate,
  today,
}: RunwayInput): RunwayResult {
  /** Append 'T00:00:00Z' to force UTC midnight, avoiding DST-induced 1-hour drift */
  const toUTC = (d: string) => new Date(d + 'T00:00:00Z');
  const todayStr = today ?? new Date().toISOString().slice(0, 10);
  const todayDate = toUTC(todayStr);
  const target = toUTC(targetDate);

  /** 24(h) * 60(m) * 60(s) * 1000(ms) */
  const DAY_IN_MILLISECONDS = 86_400_000;

  const daysLeft = Math.ceil(
    (target.getTime() - todayDate.getTime()) / DAY_IN_MILLISECONDS,
  );
  const totalKRW = krwBalance + gbpBalance * exchangeRate;
  const dailyBudgetKRW = daysLeft > 0 ? Math.round(totalKRW / daysLeft) : 0;
  const dailyBudgetGBP =
    dailyBudgetKRW > 0
      ? parseFloat((dailyBudgetKRW / exchangeRate).toFixed(1))
      : 0;

  return { totalKRW, daysLeft, dailyBudgetKRW, dailyBudgetGBP };
}
