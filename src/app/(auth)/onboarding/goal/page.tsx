import Link from 'next/link';
import { saveOnboardingData } from '../actions';
import DateField from '@/features/onboarding/components/DateField';

export default async function OnboardingGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ krw?: string; gbp?: string }>;
}) {
  const { krw = '', gbp = '' } = await searchParams;

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col relative">
        <div className="ob-progress">
          <div className="ob-step ob-step-done" />
          <div className="ob-step ob-step-active" />
        </div>
        <Link href="/onboarding/account" className="back-btn absolute top-12 left-5">
          <img src="/arrow.svg" width={20} height={20} alt="back" />
        </Link>
        <div className="px-6 pt-6">
          <p className="ob-step-label">2 / 2</p>
          <h1 className="ob-heading">
            How long do you plan
            <br />
            to live on this budget?
          </h1>
          <p className="ob-desc">This is used to calculate your recommended daily budget</p>
        </div>
        <form action={saveOnboardingData} className="auth-form mt-8">
          <input type="hidden" name="krwBalance" value={krw} />
          <input type="hidden" name="gbpBalance" value={gbp} />
          <DateField />
          <button className="btn-primary mt-6" type="submit">
            Get Started →
          </button>
        </form>
      </div>
    </div>
  );
}
