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
    <div style={{ minHeight: '100dvh', background: 'white', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column' }}>
        <div className="ob-progress">
          <div className="ob-step ob-step-active" />
          <div className="ob-step" />
        </div>
        <div style={{ padding: '24px 24px 0' }}>
          <p className="ob-step-label">1 / 2</p>
          <h1 className="ob-heading">Set your accounts</h1>
          <p className="ob-desc">Enter your current balances.</p>
          <p className="ob-desc" style={{ marginTop: 0 }}>
            You can always update these in Settings.
          </p>
        </div>
        <form className="auth-form" style={{ marginTop: 32 }} onSubmit={handleSubmit}>
          <div className="account-card-input">
            <div className="account-card-input-flag">🇰🇷</div>
            <div style={{ flex: 1 }}>
              <div className="account-card-input-label">Korean Won (KRW)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#3B424E', fontWeight: 600, fontSize: 16 }}>₩</span>
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
          <div className="account-card-input" style={{ marginTop: 12 }}>
            <div className="account-card-input-flag">🇬🇧</div>
            <div style={{ flex: 1 }}>
              <div className="account-card-input-label">British Pound (GBP)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#3B424E', fontWeight: 600, fontSize: 16 }}>£</span>
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
          <button className="btn-primary" style={{ marginTop: 32 }} type="submit">
            Next
          </button>
        </form>
      </div>
    </div>
  );
}
