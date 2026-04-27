'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { resendConfirmation } from '../../../app/(auth)/signup/confirm/actions';
import { RunwayLogo } from '@/features/auth/components/RunwayLogo';

export function ConfirmContent({ email }: { email: string }) {
  const [cooldown, setCooldown] = useState(0);
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResend() {
    setResendError('');
    const result = await resendConfirmation(email);
    if ('error' in result) {
      setResendError(result.error);
    } else {
      setCooldown(60);
    }
  }

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <div className="auth-hero">
          <RunwayLogo size={48} />
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-sub">We sent a confirmation link to</p>
          <p className="text-sm font-bold text-primary">{email}</p>
        </div>
        <div className="auth-form">
          {resendError && <p className="text-[13px] text-warning mb-2">{resendError}</p>}
          <Link href="/login" className="btn-primary block text-center">
            Go to Sign In
          </Link>
          <button onClick={handleResend} disabled={cooldown > 0} className="btn-secondary">
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend confirmation email'}
          </button>
        </div>
      </div>
    </div>
  );
}
