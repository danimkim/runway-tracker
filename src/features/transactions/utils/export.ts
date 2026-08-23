export interface TransactionExportRecord {
  id: string;
  merchant_name: string | null;
  amount: number | string | null;
  currency: string | null;
  category: string | null;
  approval_no: string | null;
  local_amount: number | string | null;
  local_currency: string | null;
  exchange_rate: number | string | null;
  krw_amount: number | string | null;
  source: string | null;
  receipt_url: string | null;
  transacted_at: string | null;
}

export interface ExportDateRange {
  from?: string;
  to?: string;
}

export interface ExportDateFilters {
  fromIso?: string;
  toIso?: string;
}

export const TRANSACTION_EXPORT_COLUMNS = [
  'transacted_at',
  'merchant_name',
  'amount',
  'currency',
  'category',
  'approval_no',
  'local_amount',
  'local_currency',
  'exchange_rate',
  'krw_amount',
  'source',
  'receipt_file',
  'receipt_source_path',
] as const;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UNSAFE_FILENAME_CHARS_RE = /[^a-zA-Z0-9._-]+/g;

export function buildDateFilters({ from, to }: ExportDateRange): ExportDateFilters {
  return {
    fromIso: isDateInput(from) ? `${from}T00:00:00.000Z` : undefined,
    toIso: isDateInput(to) ? `${to}T23:59:59.999Z` : undefined,
  };
}

export function isDateInput(value: string | undefined): value is string {
  if (!value || !DATE_RE.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function buildReceiptFilePath(transaction: TransactionExportRecord): string {
  if (!transaction.receipt_url) return '';

  const date = transaction.transacted_at?.slice(0, 10) || 'unknown-date';
  const merchant = sanitizeFilenamePart(transaction.merchant_name || 'unknown-merchant');
  const ext = getFileExtension(transaction.receipt_url);

  return `receipts/${date}_${merchant}_${transaction.id}${ext}`;
}

export function buildTransactionsCsv(
  transactions: TransactionExportRecord[],
  receiptFilesByTransactionId: Map<string, string> = new Map(),
): string {
  const rows = transactions.map((transaction) => [
    transaction.transacted_at ?? '',
    transaction.merchant_name ?? '',
    transaction.amount ?? '',
    transaction.currency ?? '',
    transaction.category ?? '',
    transaction.approval_no ?? '',
    transaction.local_amount ?? '',
    transaction.local_currency ?? '',
    transaction.exchange_rate ?? '',
    transaction.krw_amount ?? '',
    transaction.source ?? '',
    receiptFilesByTransactionId.get(transaction.id) ?? '',
    transaction.receipt_url ?? '',
  ]);

  return [
    TRANSACTION_EXPORT_COLUMNS.join(','),
    ...rows.map((row) => row.map(csvCell).join(',')),
  ].join('\n');
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (!/[",\n\r]/.test(text)) return text;

  return `"${text.replaceAll('"', '""')}"`;
}

function getFileExtension(path: string): string {
  const fileName = path.split('/').pop() ?? '';
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : '';

  return /^\.[a-zA-Z0-9]{1,8}$/.test(ext) ? ext.toLowerCase() : '.jpg';
}

function sanitizeFilenamePart(value: string): string {
  const normalized = value.trim().replaceAll('&', 'and').replace(UNSAFE_FILENAME_CHARS_RE, '-');
  const trimmed = normalized.replace(/^-+|-+$/g, '').slice(0, 48);

  return trimmed || 'unknown-merchant';
}
