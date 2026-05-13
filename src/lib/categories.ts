export const CATEGORY_NAMES = [
  'Food',
  'Transport',
  'Groceries',
  'Dining',
  'Shopping',
  'Healthcare',
  'Other',
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export function isCategoryName(v: string): v is CategoryName {
  return (CATEGORY_NAMES as readonly string[]).includes(v);
}

export const CATEGORY_COLORS: Record<CategoryName, string> = {
  Food: '#8991B2',
  Transport: '#B0B9D3',
  Groceries: '#7BBFB5',
  Dining: '#C49BAA',
  Shopping: '#9BC4C9',
  Healthcare: '#AAB5C5',
  Other: '#BBBBC4',
};

export const CATEGORY_EMOJI: Record<CategoryName, string> = {
  Food: '🍱',
  Transport: '🚇',
  Groceries: '🛒',
  Dining: '🍽️',
  Shopping: '🛍️',
  Healthcare: '💊',
  Other: '📦',
};
