export function formatKRW(v: number) {
  return '₩' + Math.round(Math.abs(v)).toLocaleString('ko-KR');
}

export function formatGBP(v: number) {
  return '£' + Math.abs(v).toFixed(2);
}

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
