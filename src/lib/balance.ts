/**
 * Calculate the actual balance of GBP
 * @description
 * GBP Balance = Initial Balance(accounts.balance) + GBPExchange In - Transactions
 */
export function calcActualGBPBalance(params: {
  initialBalance: number;
  totalGbpIn: number;
  totalTransactions: number;
}): number {
  return params.initialBalance + params.totalGbpIn - params.totalTransactions;
}

/**
 * Calculate the actual balance of KRW
 * @description
 * KRW Balance = Initial Balance(accounts.balance) - KRW Exchange Out
 */
export function calcActualKRWBalance(params: {
  initialBalance: number;
  totalKrwOut: number;
}): number {
  return params.initialBalance - params.totalKrwOut;
}
