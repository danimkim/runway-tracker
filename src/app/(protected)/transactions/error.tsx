'use client';

export default function TransactionsError() {
  return (
    <div className="screen has-bottom-nav px-5 pt-14">
      <h1 className="text-[22px] font-bold text-primary">Transactions</h1>
      <div role="alert" className="mt-6 rounded-item bg-white p-5 shadow-(--shadow-card)">
        <h2 className="font-semibold text-primary">Unable to load transactions</h2>
        <p className="mt-2 text-sm text-muted">Please try again to load your transactions and total.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-btn bg-accent px-4 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
