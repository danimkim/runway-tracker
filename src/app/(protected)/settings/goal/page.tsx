import { createClient } from '@/lib/supabase/server';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { GoalForm } from './GoalForm';

export default async function GoalPeriodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: settings } = await supabase
    .from('user_settings')
    .select('target_date')
    .eq('user_id', user!.id)
    .single();

  const targetDate = settings?.target_date ?? null;
  const currentDaysLeft = targetDate
    ? Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Goal Period" backHref="/settings" />
      <div className="p-5 pb-[100px]">
        <GoalForm currentTarget={targetDate} currentDaysLeft={currentDaysLeft} />
      </div>
    </div>
  );
}
