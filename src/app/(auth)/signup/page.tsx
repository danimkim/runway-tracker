'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signup } from '@/features/auth/actions/signup';
import { RunwayLogo } from '@/features/auth/components/RunwayLogo';
import { AuthField } from '@/features/auth/components/AuthField';

export default function SignupPage() {
  const router = useRouter();
  const [state, signupAction, isPending] = useActionState(signup, null);

  useEffect(() => {
    if (state && 'email' in state) {
      router.replace(`/signup/confirm?email=${encodeURIComponent(state.email)}`);
    }
  }, [state, router]);

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <div className="pt-5 px-6">
          <Link href="/login" className="inline-flex items-center justify-center w-9 h-9">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12 5L7 10L12 15"
                stroke="var(--color-accent)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
        <div className="auth-hero mt-5">
          <RunwayLogo size={48} />
          <h1 className="auth-title text-[24px]">Create Account</h1>
          <p className="auth-sub">{`Let's get you set up`}</p>
        </div>
        <form className="auth-form" action={signupAction}>
          <AuthField name="email" label="Email" type="email" placeholder="hello@example.com" required />
          <AuthField name="password" label="Password" type="password" placeholder="8+ characters" required />
          <AuthField name="confirmPassword" label="Confirm Password" type="password" placeholder="••••••••" required />
          {'error' in (state ?? {}) && (
            <p className="text-[13px] text-warning mt-1">{(state as { error: string }).error}</p>
          )}
          <button type="submit" className="btn-primary mt-2" disabled={isPending}>
            {isPending ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="auth-switch">
            Already have an account?{' '}
            <Link href="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
