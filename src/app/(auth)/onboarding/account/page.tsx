'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OnboardingAccountPage() {
  const router = useRouter();
  const [krw, setKrw] = useState('');
  const [gbp, setGbp] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (krw) params.set('krw', krw);
    if (gbp) params.set('gbp', gbp);
    router.push(`/onboarding/goal?${params}`);
  }

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-107.5 flex flex-col">
        <div className="ob-progress">
          <div className="ob-step ob-step-active" />
          <div className="ob-step" />
        </div>
        <div className="px-6 pt-6">
          <p className="ob-step-label">1 / 2</p>
          <h1 className="ob-heading">Set your accounts</h1>
          <p className="ob-desc">Enter your current balances.</p>
          <p className="ob-desc mt-0">You can always update these in Settings.</p>
        </div>
        <form className="auth-form mt-8" onSubmit={handleSubmit}>
          <div className="account-card-input">
            <div className="account-card-input-flag">🇰🇷</div>
            <div className="flex-1">
              <div className="account-card-input-label">Korean Won (KRW)</div>
              <div className="flex items-center gap-1">
                <span className="text-accent font-semibold text-base">₩</span>
                <input
                  className="account-num-input"
                  type="number"
                  placeholder="12300000"
                  value={krw}
                  onChange={(e) => setKrw(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <div className="account-card-input mt-3">
            <div className="account-card-input-flag">🇬🇧</div>
            <div className="flex-1">
              <div className="account-card-input-label">British Pound (GBP)</div>
              <div className="flex items-center gap-1">
                <span className="text-accent font-semibold text-base">£</span>
                <input
                  className="account-num-input"
                  type="number"
                  step="0.01"
                  placeholder="1840.00"
                  value={gbp}
                  onChange={(e) => setGbp(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
          <button className="btn-primary mt-8" type="submit">
            Next
          </button>
        </form>
      </div>
    </div>
  );
}
