import Link from 'next/link';
import { saveOnboardingData } from '../actions';
import DateField from './DateField';

export default async function OnboardingGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ krw?: string; gbp?: string }>;
}) {
  const { krw = '', gbp = '' } = await searchParams;

  return (
    <div style={{ minHeight: '100dvh', background: 'white', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div className="ob-progress">
          <div className="ob-step ob-step-done" />
          <div className="ob-step ob-step-active" />
        </div>
        <Link
          href="/onboarding/account"
          className="back-btn"
          style={{ position: 'absolute', top: 48, left: 20 }}
        >
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
        <div style={{ padding: '24px 24px 0' }}>
          <p className="ob-step-label">2 / 2</p>
          <h1 className="ob-heading">
            언제까지 이 돈으로
            <br />
            생활할 예정인가요?
          </h1>
          <p className="ob-desc">권장 일 예산 계산에 사용됩니다</p>
        </div>
        <form action={saveOnboardingData} className="auth-form" style={{ marginTop: 32 }}>
          <input type="hidden" name="krwBalance" value={krw} />
          <input type="hidden" name="gbpBalance" value={gbp} />
          <DateField />
          <button className="btn-primary" style={{ marginTop: 24 }} type="submit">
            시작하기 →
          </button>
        </form>
      </div>
    </div>
  );
}
