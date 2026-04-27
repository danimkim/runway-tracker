export default function WeeklyBarChart({ data }: { data: { label: string; amount: number }[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 px-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-badge ${i === data.length - 1 ? 'bg-accent' : 'bg-light'}`}
            style={{ height: Math.max(4, (d.amount / max) * 68) }}
          />
          <span className="text-[10px] text-muted font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
