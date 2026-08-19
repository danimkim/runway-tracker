import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { CATEGORY_NAMES, CATEGORY_COLORS, CATEGORY_EMOJI, CategoryName } from '@/lib/categories';
import { updateTransactionCategory } from './actions';
import { ReceiptUpload } from '@/features/transactions/components/ReceiptUpload';
import { getTransactionById } from '@/features/transactions/data/transactions';
import { DeleteTransactionButton } from '@/features/transactions/components/DeleteTransactionButton';

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
          {tx.transacted_at
            ? new Date(tx.transacted_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
            : ''}
        </p>
      </div>

      <div className="flex flex-col pt-5 px-5 pb-[100px] gap-4">
        <form action={updateTransactionCategory} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={tx.id} />

          {/* Category */}
          <div className="bg-white rounded-item p-4 shadow-(--shadow-card)">
            <p className="text-[13px] font-semibold text-secondary mb-3">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_NAMES.map((c) => (
                <label
                  key={c}
                  className="py-2 px-[14px] rounded-[10px] text-[13px] font-semibold cursor-pointer"
                  style={{
                    background: tx.category === c ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: tx.category === c ? 'white' : 'var(--color-secondary)',
                  }}
                >
                  <input type="radio" name="category" value={c} defaultChecked={tx.category === c} className="hidden" />
                  {CATEGORY_EMOJI[c]} {c}
                </label>
              ))}
            </div>
          </div>

          {/* Memo */}
          {/* <div className="bg-white rounded-item p-4 shadow-(--shadow-card)">
          <p className="text-[13px] font-semibold text-secondary mb-2.5">Memo</p>
          <textarea
            className="field-input resize-none h-20 leading-normal"
            name="memo"
            placeholder="Add a note..."
            defaultValue={tx.receipt_url ?? ''}
          />
        </div> */}
          <ReceiptUpload transactionId={tx.id} userId={user.id} currentReceiptUrl={tx.receipt_url} />

          <button className="btn-primary">Save</button>
        </form>

        <DeleteTransactionButton transactionId={tx.id} />
      </div>
    </div>
  );
}
