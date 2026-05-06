// Import from the lib path to avoid pdf-parse's debug self-test code running in non-Node contexts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
  dataBuffer: Buffer,
  options?: object
) => Promise<{ text: string }>;
import type { TossBankTransaction, ParseResult } from './types';

const SUPPORTED_CURRENCIES = ['GBP', 'EUR', 'USD'] as const;
type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export async function parseTossBankPDF(buffer: Buffer): Promise<ParseResult> {
  try {
    const { text } = await pdfParse(buffer);
    const transactions = parseTossBankText(text);
    return { ok: true, transactions };
  } catch (e) {
    return { ok: false, transactions: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export function parseTossBankText(rawText: string): TossBankTransaction[] {
  const text = cleanText(rawText);
  const chunks = text
    .split(/(?=\d{4}\.\d{2}\.\d{2}\.)/)
    .filter((s) => /^\d{4}\.\d{2}\.\d{2}\./.test(s.trim()));
  return chunks.map(parseChunk).filter((t): t is TossBankTransaction => t !== null);
}

function cleanText(text: string): string {
  let cleaned = text.replace(/DateStatus[\s\S]*?Account no\./g, '');
  cleaned = cleaned.replace(/\d+ \/ \d+/g, '');
  const footerIdx = cleaned.indexOf('Total amount');
  if (footerIdx !== -1) cleaned = cleaned.slice(0, footerIdx);
  return cleaned;
}

function parseChunk(chunk: string): TossBankTransaction | null {
  const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 6) return null;

  const dateMatch = lines[0].match(/^(\d{4})\.(\d{2})\.(\d{2})\.$/);
  const timeMatch = lines[1]?.match(/^(\d{2}:\d{2}:\d{2})$/);
  if (!dateMatch || !timeMatch) return null;
  const transacted_at = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;

  const statusMatch = lines[2].match(/^(Approved|Canceled)(\d+)/);
  if (!statusMatch) return null;
  const status = statusMatch[1] as 'Approved' | 'Canceled';
  const approval_no = statusMatch[2];

  const exchange_rate = parseFloat(lines[lines.length - 3].replace(/,/g, ''));
  if (isNaN(exchange_rate) || exchange_rate <= 0) return null;
  const currencyPair = lines[lines.length - 2];
  const rawCurrency = currencyPair.split('/')[0];
  if (!SUPPORTED_CURRENCIES.includes(rawCurrency as SupportedCurrency)) return null;
  const local_currency = rawCurrency as SupportedCurrency;

  const afterApprovalOnLine2 = lines[2].slice(statusMatch[0].length);
  const middleLines = lines.slice(3, lines.length - 3);
  const middleText = [afterApprovalOnLine2, ...middleLines].join(' ').trim();

  const currencyAlt = SUPPORTED_CURRENCIES.join('|');
  const feeKrwMatch = middleText.match(new RegExp(`-([\\d.]+)\\s*(?:${currencyAlt})([\\d,]+)\\s*$`));
  if (!feeKrwMatch) return null;
  const fee = parseFloat(feeKrwMatch[1]);
  const krw_amount = parseInt(feeKrwMatch[2].replace(/,/g, ''), 10);

  const localCurrRe = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${local_currency}\\s*-`);
  const localMatch = middleText.match(localCurrRe);
  if (!localMatch) return null;
  let local_amount = parseFloat(localMatch[1]);

  if (exchange_rate > 0 && krw_amount > 0) {
    const ratio = Math.abs((local_amount + fee) * exchange_rate - krw_amount) / krw_amount;
    if (ratio > 0.05) {
      const numStr = localMatch[1];
      for (let i = 1; i < numStr.length; i++) {
        const candidate = parseFloat(numStr.slice(i));
        if (!isNaN(candidate)) {
          const r = Math.abs((candidate + fee) * exchange_rate - krw_amount) / krw_amount;
          if (r <= 0.05) { local_amount = candidate; break; }
        }
      }
    }
  }

  const amtIdx = localMatch.index!;
  const rawMerchant = middleText.slice(0, amtIdx).trim();
  const merchant_name = rawMerchant.replace(/\d+$/, '').trim() || rawMerchant;
  if (!merchant_name) return null;

  return { transacted_at, status, approval_no, merchant_name, local_amount, local_currency, krw_amount, exchange_rate };
}
