import { calcRunway } from '@/lib/runway';

describe('calcRunway', () => {
  it('returns daily budget in KRW', () => {
    const result = calcRunway({
      krwBalance: 12_300_000,
      gbpBalance: 1840,
      exchangeRate: 1720,
      targetDate: '2026-12-31',
      today: '2026-04-20',
    });

    expect(result.totalKRW).toBe(15_464_800);
    expect(result.daysLeft).toBe(255);
    expect(result.dailyBudgetKRW).toBe(Math.round(15_464_800 / 255));
  });

  it('returns 0 dailyBudget when target date passed', () => {
    const result = calcRunway({
      krwBalance: 1_000_000,
      gbpBalance: 100,
      exchangeRate: 1720,
      targetDate: '2026-01-01',
      today: '2026-04-20',
    });

    expect(result.daysLeft).toBeLessThan(0);
    expect(result.dailyBudgetKRW).toBe(0);
  });
});
