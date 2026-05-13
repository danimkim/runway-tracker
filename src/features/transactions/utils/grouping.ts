/**
 * Group transactions by date
 */
export function groupByDate<T extends { transacted_at: string | null }>(items: T[]): [string, T[]][] {
  const g: Record<string, T[]> = {};
  items.forEach((item) => {
    const d = item.transacted_at?.slice(0, 10) ?? '';
    if (!g[d]) g[d] = [];
    g[d].push(item);
  });
  return Object.entries(g).sort((a, b) => b[0].localeCompare(a[0]));
}
