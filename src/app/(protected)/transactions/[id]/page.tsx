import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { CATEGORY_NAMES, CATEGORY_COLORS, CATEGORY_EMOJI, CategoryName } from '@/lib/categories';
import { ReceiptUpload } from '@/features/transactions/components/ReceiptUpload';
import { getTransactionById } from '@/features/transactions/data/transactions';
import { DeleteTransactionButton } from '@/features/transactions/components/DeleteTransactionButton';
import { TransactionDateTime } from './TransactionDateTime';

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tx = await getTransactionById(id, user.id);
  if (!tx) notFound();

  const cat = CATEGORY_NAMES.includes(tx.category as CategoryName) ? (tx.category as CategoryName) : null;
  const catColor = cat ? CATEGORY_COLORS[cat] : null;

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Transaction" backHref="/transactions" />

      {/* Hero */}
      <div className="bg-white text-center pt-5 px-5 pb-2">
        <div
          className="w-14 h-14 rounded-[18px] flex items-center justify-center text-[26px] mx-auto mb-3"
          style={{ background: catColor ? catColor + '22' : 'var(--color-surface)' }}
        >
          {cat ? CATEGORY_EMOJI[cat] : '❓'}
        </div>
        <p className="text-[28px] font-extrabold text-primary tracking-[-0.5px]">-£{tx.amount?.toFixed(2)}</p>
        <p className="text-[15px] text-secondary font-medium mt-1">{tx.merchant_name}</p>
        <p className="text-[13px] text-faint mt-0.5">
          <TransactionDateTime value={tx.transacted_at} />
        </p>
      </div>

      <div className="flex flex-col pt-5 px-5 pb-[100px] gap-4">
        <div className="bg-white rounded-item p-4 shadow-(--shadow-card)">
          <p className="text-[13px] font-semibold text-secondary mb-3">Category</p>
          <div
            className="inline-flex py-2 px-[14px] rounded-[10px] text-[13px] font-semibold"
            style={{
              background: catColor ? catColor + '22' : 'var(--color-warning-bg)',
              color: catColor ?? 'var(--color-warning)',
            }}
          >
            {cat ? `${CATEGORY_EMOJI[cat]} ${cat}` : 'Uncategorized'}
          </div>
        </div>

        <ReceiptUpload transactionId={tx.id} userId={user.id} currentReceiptUrl={tx.receipt_url} />

        <Link href={`/transactions/${tx.id}/edit`} className="btn-primary no-underline text-center">
          Edit transaction
        </Link>

        <DeleteTransactionButton transactionId={tx.id} />
      </div>
    </div>
  );
}
