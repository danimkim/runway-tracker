import { SubPageHeader } from '@/components/layout/SubPageHeader';

export default function ExportTransactionHistoryPage() {
  return (
    <div className="screen overflow-y-auto">
      <SubPageHeader title="Export History" backHref="/settings" />
      <div className="p-5 pb-24 flex flex-col gap-4">
        <form
          action="/api/transactions/export"
          method="get"
          className="bg-card rounded-item p-4 shadow-card"
        >
          <div className="mb-5">
            <p className="text-[15px] font-semibold text-primary">Export Transaction History</p>
            <p className="text-xs text-muted mt-1">Download GBP spending records with receipt images.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">From</span>
              <input
                type="date"
                name="from"
                className="min-w-0 rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] text-primary"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">To</span>
              <input
                type="date"
                name="to"
                className="min-w-0 rounded-[10px] border border-border bg-white px-3 py-2 text-[13px] text-primary"
              />
            </label>
          </div>

          <button
            type="submit"
            className="w-full rounded-[10px] bg-primary py-3 text-[14px] font-semibold text-white"
          >
            Download
          </button>
        </form>
      </div>
    </div>
  );
}
