'use client';

import { useState } from 'react';
import { SubPageHeader } from '@/components/layout/SubPageHeader';
import { saveExchangeRecord } from './actions';

export default function ExchangePage() {
  const [krwOut, setKrwOut] = useState('');
  const [gbpIn, setGbpIn] = useState('');

  const calcRate = krwOut && gbpIn ? Math.round(parseFloat(krwOut) / parseFloat(gbpIn)) : null;

  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Log Exchange" backHref="/settings" />
      <form action={saveExchangeRecord} className="flex flex-col gap-3.5 p-5 pb-24">
        {/* KRW → GBP input card */}
        <div className="bg-card rounded-card p-5 shadow-card">
          <div className="flex items-center gap-2.5 mb-4">
            {/* KRW out */}
            <div className="flex-1 bg-subtle rounded-xl p-3">
              <p className="text-[11px] font-medium text-muted mb-2">🇰🇷 Withdraw (KRW)</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xl font-bold text-accent">₩</span>
                <input
                  type="number"
                  name="krwOut"
                  placeholder="500,000"
                  required
                  value={krwOut}
                  onChange={(e) => setKrwOut(e.target.value)}
                  className="border-none bg-transparent text-2xl font-bold text-primary outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <p className="text-[11px] text-muted">Balance —</p>
            </div>

            {/* Swap arrow */}
            <div className="shrink-0">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" className="fill-surface" />
                <path
                  d="M9 11l5-5 5 5M9 17l5 5 5-5"
                  className="stroke-muted"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* GBP in */}
            <div className="flex-1 bg-subtle rounded-xl p-3">
              <p className="text-[11px] font-medium text-muted mb-2">🇬🇧 Deposit (GBP)</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-xl font-bold text-accent">£</span>
                <input
                  type="number"
                  name="gbpIn"
                  step="0.01"
                  placeholder="290.50"
                  required
                  value={gbpIn}
                  onChange={(e) => setGbpIn(e.target.value)}
                  className="border-none bg-transparent text-2xl font-bold text-primary outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <p className="text-[11px] text-muted">Balance —</p>
            </div>
          </div>

          {/* Reference rate preview */}
          <div className="bg-surface rounded-[10px] px-3.5 py-2.5 flex justify-between items-center">
            <span className="text-[13px] text-secondary">Reference Rate</span>
            <span className="text-sm font-bold text-accent">
              {calcRate !== null ? `₩${calcRate.toLocaleString()} / £` : '—'}
            </span>
          </div>
        </div>

        {/* Date card */}
        <div className="bg-card rounded-item p-4 shadow-card">
          <label className="field-label">Exchange date</label>
          <input
            className="field-input"
            name="exchangedAt"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>

        <button className="btn-primary" type="submit">
          Save
        </button>
      </form>
    </div>
  );
}
