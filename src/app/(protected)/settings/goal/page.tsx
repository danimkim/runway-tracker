import { createClient } from '@/lib/supabase/server';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { GoalForm } from '@/features/settings/components/GoalForm';
import { getTargetDate } from '@/features/settings/data/settings';
import { getDaysLeft } from '@/features/settings/utils/date';

export default async function GoalPeriodPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const targetDate = await getTargetDate(user!.id, supabase);
  const currentDaysLeft = targetDate ? getDaysLeft(targetDate) : null;

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Goal Period" backHref="/settings" />
      <div className="p-5 pb-[100px]">
        <GoalForm currentTarget={targetDate} currentDaysLeft={currentDaysLeft} />
      </div>
    </div>
  );
}
