'use client';

import { useActionState } from 'react'
import Link from 'next/link'
import { RunwayLogo } from '@/features/auth/components/RunwayLogo'
import { AuthField } from '@/features/auth/components/AuthField'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(requestPasswordReset, null)

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <div className="pt-5 px-6">
          <Link href="/login" aria-label="Back to login" className="inline-flex items-center justify-center w-9 h-9">
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
          <h1 className="auth-title text-[24px]">Forgot Password</h1>
          <p className="auth-sub">Enter your email to receive a reset link</p>
        </div>
        <form className="auth-form" action={formAction}>
          <AuthField name="email" label="Email" type="email" placeholder="hello@example.com" required />
          {state?.error && <p className="text-[13px] text-warning mt-1">{state.error}</p>}
          <button type="submit" className="btn-primary mt-2" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="auth-switch">
            Remember your password?{' '}
            <Link href="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
