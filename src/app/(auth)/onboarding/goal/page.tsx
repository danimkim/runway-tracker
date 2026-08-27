import Link from 'next/link';
import { saveOnboardingData } from '@/features/onboarding/actions/save-onboarding-data';
import DateField from '@/features/onboarding/components/DateField';

export default async function OnboardingGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ krw?: string; gbp?: string }>;
}) {
  const { krw = '', gbp = '' } = await searchParams;

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-107.5 flex flex-col">
        <div className="ob-progress">
          <div className="ob-step ob-step-done" />
          <div className="ob-step ob-step-active" />
        </div>
        <div className="px-6 pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/onboarding/account" className="back-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M12 5L7 10L12 15"
                  stroke="#3B424E"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <p className="ob-step-label">2 / 2</p>
          </div>
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
