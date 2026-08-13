import { redirect } from 'next/navigation';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { createClient } from '@/lib/supabase/server';
import { CreateTransactionForm } from '@/features/transactions/components/CreateTransactionForm';

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="New Transaction" backHref="/transactions" />
      <CreateTransactionForm defaultDate={new Date().toISOString().slice(0, 10)} />
    </div>
  );
}
