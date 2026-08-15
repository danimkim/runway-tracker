const MS_PER_DAY = 86_400_000;

export function getDaysLeft(targetDate: string, referenceDate = new Date()) {
  return Math.ceil((new Date(targetDate).getTime() - referenceDate.getTime()) / MS_PER_DAY);
}
