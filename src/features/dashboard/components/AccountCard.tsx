interface AccountCardProps {
  flag: string;
  label: string;
  currency: string;
  amount: number;
  fmt: (amount: number) => string;
}

export default function AccountCard({ flag, label, currency, amount, fmt }: AccountCardProps) {
  return (
    <div key={currency} className="flex-1 bg-card rounded-item py-4 px-5 shadow-card">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{flag}</span>
        <span className="text-[12px] text-label font-medium">{label}</span>
      </div>
      <div className="text-[22px] font-extrabold text-primary tracking-[-0.5px]">{fmt(amount)}</div>
      <div className="mt-1.5 text-[11px] font-semibold rounded-badge px-1.5 py-0.5 inline-block bg-surface text-secondary">
        {currency}
      </div>
    </div>
  );
}
