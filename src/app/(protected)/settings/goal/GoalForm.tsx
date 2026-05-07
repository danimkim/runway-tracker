'use client';

import { useState } from 'react';
import { updateTargetDate } from './actions';

interface GoalFormProps {
  currentTarget: string | null;
  currentDaysLeft: number | null;
}

export function GoalForm({ currentTarget, currentDaysLeft }: GoalFormProps) {
  const [date, setDate] = useState(currentTarget ?? '');

  const daysLeft = date ? Math.ceil((new Date(date + 'T00:00:00').getTime() - Date.now()) / 86_400_000) : null;

  return (
    <form action={updateTargetDate} className="flex flex-col gap-[14px]">
      <div className="bg-white rounded-item p-4 shadow-card">
        {/* Current target row */}
        <div className="flex justify-between mb-3">
          <span className="text-[13px] text-label">Current target</span>
          <span className="text-[13px] font-semibold text-accent">
            {currentTarget && currentDaysLeft !== null ? `${currentTarget} (D-${currentDaysLeft})` : '—'}
          </span>
        </div>

        {/* New target date label + input */}
        <label className="field-label block mb-2">New target date</label>
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
          <div className="mt-[10px] bg-(--color-surface) rounded-[10px] p-[10px] text-center">
            <span className="text-[14px] font-bold text-accent">D-{daysLeft}</span>
            <span className="text-[13px] text-label ml-2">{daysLeft} days left</span>
          </div>
        )}
      </div>

      <button type="submit" className="btn-primary">
        Save
      </button>
    </form>
  );
}
