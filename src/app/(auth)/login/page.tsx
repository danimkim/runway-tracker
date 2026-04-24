'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from './actions';

function RunwayLogo({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="12" fill="#3B424E" />
      <path d="M20 8L20 32" stroke="#B0B9D3" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 14L20 8L28 14" stroke="#B0B9D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 26L20 22L32 26" stroke="#AAB5C5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 31L20 28L34 31" stroke="#8991B2" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const [state, loginAction, isPending] = useActionState(login, null);

  return (
    <div style={{ minHeight: '100dvh', background: 'white', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column' }}>
        <div className="auth-hero">
          <RunwayLogo size={52} />
          <h1 className="auth-title">Runway Tracker</h1>
        </div>
        <form className="auth-form" action={loginAction}>
          <div className="field-group">
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              className="field-input"
              id="email"
              name="email"
              type="email"
              placeholder="hello@example.com"
              required
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              className="field-input"
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          {state?.error && <p style={{ color: 'var(--color-warning)', fontSize: 13, marginTop: 4 }}>{state.error}</p>}
          <button type="submit" className="btn-primary" style={{ marginTop: 8 }} disabled={isPending}>
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
