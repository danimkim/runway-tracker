'use client'

import { useActionState } from 'react'
import { RunwayLogo } from '@/features/auth/components/RunwayLogo'
import { AuthField } from '@/features/auth/components/AuthField'
import { resetPassword } from './actions'

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPassword, null)

  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <div className="auth-hero">
          <RunwayLogo size={52} />
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-sub">Choose a new password for your account</p>
        </div>
        <form className="auth-form" action={formAction}>
          <AuthField
            name="password"
            label="New Password"
            type="password"
            placeholder="8+ characters"
            required
          />
          <AuthField
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            required
          />
          {state?.error && (
            <p className="text-[13px] text-warning mt-1">{state.error}</p>
          )}
          <button type="submit" className="btn-primary mt-2" disabled={isPending}>
            {isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
