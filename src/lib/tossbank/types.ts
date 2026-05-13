// src/lib/tossbank/types.ts
export type TossBankTransaction = {
  transacted_at: string;      // 'YYYY-MM-DD'
  status: 'Approved' | 'Canceled';
  approval_no: string;
  merchant_name: string;
  local_amount: number;
  local_currency: 'GBP' | 'EUR' | 'USD';
  krw_amount: number;
  exchange_rate: number;
};

export type ParseResult = {
  ok: boolean;
  transactions: TossBankTransaction[];
  error?: string;
};
