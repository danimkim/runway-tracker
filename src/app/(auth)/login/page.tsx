'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from './actions';
import { RunwayLogo } from '@/features/auth/components/RunwayLogo';
import { AuthField } from '@/features/auth/components/AuthField';

export default function LoginPage() {
  const [state, loginAction, isPending] = useActionState(login, null);

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <div className="auth-hero">
          <RunwayLogo size={52} />
          <h1 className="auth-title">Runway Tracker</h1>
        </div>
        <form className="auth-form" action={loginAction}>
          <AuthField name="email" label="Email" type="email" placeholder="hello@example.com" required />
          <AuthField name="password" label="Password" type="password" placeholder="••••••••" required />
          {state?.error && <p className="text-[13px] text-warning mt-1">{state.error}</p>}
          <button type="submit" className="btn-primary mt-2" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="auth-switch">
            Don't have an account?{' '}
            <Link href="/signup" className="auth-link">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
