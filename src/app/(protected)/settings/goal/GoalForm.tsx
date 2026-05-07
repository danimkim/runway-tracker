'use client';

import { useState } from 'react';
import { updateTargetDate } from './actions';

interface GoalFormProps {
  currentTarget: string | null;
  currentDaysLeft: number | null;
}

export function GoalForm({ currentTarget, currentDaysLeft }: GoalFormProps) {
  const [date, setDate] = useState(currentTarget ?? '');

  const daysLeft = date
    ? Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <form action={updateTargetDate} className="flex flex-col gap-[14px]">
      <div className="bg-white rounded-[16px] p-4 shadow-[0_1px_4px_rgba(59,66,78,0.06)]">
        {/* Current target row */}
        <div className="flex justify-between mb-3">
          <span className="text-[13px] text-[var(--color-label)]">
            Current target
          </span>
          <span className="text-[13px] font-semibold text-[var(--color-accent)]">
            {currentTarget && currentDaysLeft !== null
              ? `${currentTarget} (D-${currentDaysLeft})`
              : '—'}
          </span>
        </div>

        {/* New target date label + input */}
        <label
          className="field-label block mb-2"
        >
          New target date
        </label>
        <input
          type="date"
          name="targetDate"
          className="field-input"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDate(e.target.value)}
        />

        {/* Live D-day preview */}
        {daysLeft !== null && daysLeft > 0 && (
          <div className="mt-[10px] bg-[var(--color-surface)] rounded-[10px] p-[10px] text-center">
            <span className="text-[14px] font-bold text-[var(--color-accent)]">
              D-{daysLeft}
            </span>
            <span className="text-[13px] text-[var(--color-label)] ml-2">
              {daysLeft} days left
            </span>
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary">
        Save
      </button>
    </form>
  );
}
