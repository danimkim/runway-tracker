import Link from 'next/link'
import { RunwayLogo } from '@/features/auth/components/RunwayLogo'

export default function ForgotPasswordConfirmPage() {
  return (
    <div className="min-h-dvh bg-white flex justify-center">
      <div className="w-full max-w-[430px] flex flex-col">
        <div className="auth-hero">
          <RunwayLogo size={52} />
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-sub text-center px-4">
            If an account exists for that email, you'll receive a password reset link shortly.
          </p>
        </div>
        <div className="auth-form pt-6">
          <Link href="/login" className="btn-primary text-center no-underline block py-[15px]">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
