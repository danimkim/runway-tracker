'use client';

import { useActionState, useState } from 'react';
import { verifyAndSendReset } from '@/features/settings/actions/session';

interface Props {
  userEmail: string;
}

interface ModalContentProps {
  userEmail: string;
  onClose: () => void;
}

function ModalContent({ userEmail, onClose }: ModalContentProps) {
  const [state, formAction, isPending] = useActionState(verifyAndSendReset, null);
  const isSuccess = state !== null && 'success' in state;

  return (
    <div
      className="relative w-full max-w-[430px] bg-white rounded-t-[24px] px-6 pt-6 pb-10"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle */}
      <div className="w-10 h-1 rounded-full bg-border mx-auto mb-6" />

      {isSuccess ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center text-2xl">✉️</div>
          <div className="text-center">
            <p className="text-[15px] font-bold text-primary">Reset email sent</p>
            <p className="text-[13px] text-muted mt-1">
              Check <span className="font-semibold">{userEmail}</span> for the reset link.
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary mt-2">
            Done
          </button>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-0">
          <h2 className="text-[18px] font-bold text-primary mb-1">Change Password</h2>
          <p className="text-[13px] text-muted mb-5">
            Verify your current password to receive a reset link at <span className="font-semibold">{userEmail}</span>.
          </p>
          <div className="field-group">
            <label className="field-label" htmlFor="currentPassword">
              Current Password
            </label>
            <input
              id="currentPassword"
              className="field-input"
              type="password"
              name="currentPassword"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          {state !== null && 'error' in state && <p className="text-[13px] text-warning mb-3">{state.error}</p>}
          <button type="submit" className="btn-primary" disabled={isPending}>
            {isPending ? 'Verifying...' : 'Verify & Send Reset Email'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary mt-3">
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}

export function ChangePasswordModal({ userEmail }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger row — styled to match other settings menu items */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-transparent border-none cursor-pointer font-[inherit]"
      >
        <div className="flex items-center gap-[14px] px-4 py-[15px]">
          <div className="w-[38px] h-[38px] rounded-btn bg-surface flex items-center justify-center text-lg shrink-0">
            🔑
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] font-semibold text-primary">Change Password</p>
            <p className="text-xs text-muted mt-px">Verify current password to reset</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 4l4 4-4 4"
              stroke="var(--color-light)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setIsOpen(false)}>
          <div className="fixed inset-0 bg-black/40" />
          <ModalContent userEmail={userEmail} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
