'use client';

import { useState } from 'react';

function daysLeft(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - now.getTime()) / 86_400_000);
}

export default function DateField() {
  const [date, setDate] = useState('2026-12-31');
  const days = daysLeft(date);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="date-picker-card">
      <label className="field-label" style={{ marginBottom: 8, display: 'block' }}>
        목표 날짜
      </label>
      <input
        type="date"
        className="field-input"
        name="targetDate"
        value={date}
        min={today}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      {days > 0 && (
        <div className="date-dday-preview">
          <span className="dday-chip">D-{days}</span>
          <span style={{ color: '#5A6478', fontSize: 14 }}>{days}일 남았습니다</span>
        </div>
      )}
    </div>
  );
}
