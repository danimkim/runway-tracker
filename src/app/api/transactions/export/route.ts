import JSZip from 'jszip';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildDateFilters,
  buildReceiptFilePath,
  buildTransactionsCsv,
  type TransactionExportRecord,
} from '@/features/transactions/utils/export';

export const runtime = 'nodejs';

const EXPORT_SELECT =
  'id, merchant_name, amount, transacted_at, category, receipt_url, approval_no, local_amount, local_currency, exchange_rate, krw_amount, source, currency';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const { fromIso, toIso } = buildDateFilters({
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  });

  let query = supabase
    .from('transactions')
    .select(EXPORT_SELECT)
    .eq('user_id', user.id)
    .eq('status', 'Approved')
    .eq('currency', 'GBP')
    .order('transacted_at', { ascending: false });

  if (fromIso) query = query.gte('transacted_at', fromIso);
  if (toIso) query = query.lte('transacted_at', toIso);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to load transactions.' }, { status: 500 });
  }

  const transactions = (data ?? []) as TransactionExportRecord[];
  const zip = new JSZip();
  const receiptsFolder = zip.folder('receipts');
  const receiptFilesByTransactionId = new Map<string, string>();

  await Promise.all(
    transactions.map(async (transaction) => {
      if (!transaction.receipt_url || !receiptsFolder) return;

      const receiptFilePath = buildReceiptFilePath(transaction);
      const receiptFileName = receiptFilePath.replace('receipts/', '');
      const { data: receiptBlob, error: receiptError } = await supabase.storage
        .from('receipts')
        .download(transaction.receipt_url);

      if (receiptError || !receiptBlob) return;

      receiptsFolder.file(receiptFileName, await receiptBlob.arrayBuffer());
      receiptFilesByTransactionId.set(transaction.id, receiptFilePath);
    }),
  );

  zip.file('transactions.csv', buildTransactionsCsv(transactions, receiptFilesByTransactionId));

  const zipBytes = await zip.generateAsync({ type: 'arraybuffer' });
  const today = new Date().toISOString().slice(0, 10);

  return new Response(zipBytes, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="transactions-export-${today}.zip"`,
      'Cache-Control': 'no-store',
    },
  });
}
