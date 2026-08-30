import { redirect, notFound } from 'next/navigation';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { createClient } from '@/lib/supabase/server';
import { getTransactionById } from '@/features/transactions/data/transactions';
import { EditTransactionForm } from '@/features/transactions/components/EditTransactionForm';

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const tx = await getTransactionById(id, user.id);
  if (!tx) notFound();

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Edit Transaction" backHref={`/transactions/${tx.id}`} />
      <EditTransactionForm transaction={tx} />
    </div>
  );
}
