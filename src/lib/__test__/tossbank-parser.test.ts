import { parseTossBankText, isValidTossBankDocument } from '@/lib/tossbank/parser';

const TABLE_HEADER = `DateStatus
Approval
no.
Merchant name
Amount
(Local
Currency)
Amount
(USD)
Fees
Charged
Amount
(KRW)
Exchange
Rate
Payment
Account no.`;

const DOC_HEADER = `Confirmation of Transaction Statement
Dear, TEST USER
Name of CardholderTEST USER
Card Number1234-56**-****-7890
Transaction Period2026.01.01. ~ 2026.04.15.
${TABLE_HEADER}`;

const FOOTER = `Total amount
CurrencyAmount
GBP100.00
Total amount in KRW
KRW200000`;

function wrap(transactions: string) {
  return `${DOC_HEADER}\n${transactions}\n1 / 1\n\n${FOOTER}`;
}

describe('isValidTossBankDocument', () => {
  it('returns true for text containing the Toss Bank document identifier', () => {
    expect(isValidTossBankDocument(DOC_HEADER)).toBe(true);
  });

  it('returns false for arbitrary text without the identifier', () => {
    expect(isValidTossBankDocument('This is some other PDF content.')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidTossBankDocument('')).toBe(false);
  });
});

describe('parseTossBankText', () => {
  it('parses a compact single-line transaction', () => {
    const result = parseTossBankText(wrap(`2026.01.08.
00:04:32
Approved205073STANSTED AIRPORT17 GBP-0 GBP33,233
1,954.93
GBP/KRW
700000569746`));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      transacted_at: '2026-01-08',
      status: 'Approved',
      approval_no: '205073',
      local_amount: 17,
      local_currency: 'GBP',
      krw_amount: 33233,
      exchange_rate: 1954.93,
    });
  });

  it('parses a multi-line merchant name', () => {
    const result = parseTossBankText(wrap(`2026.01.02.
21:41:21
Approved105463
GAME OF THRONES
STUDIO
2 GBP-0 GBP3,888
1,944.2
GBP/KRW
700000569746`));

    expect(result).toHaveLength(1);
    expect(result[0].merchant_name).toBe('GAME OF THRONES STUDIO');
    expect(result[0].local_amount).toBe(2);
    expect(result[0].krw_amount).toBe(3888);
  });

  it('correctly extracts local amount when store code is concatenated with it', () => {
    const result = parseTossBankText(wrap(`2026.01.09.
05:37:59
Approved206123TESCO STORES 49099.2 GBP-0 GBP17,971
1,953.47
GBP/KRW
700000569746`));

    expect(result).toHaveLength(1);
    expect(result[0].local_amount).toBe(9.2);
    expect(result[0].krw_amount).toBe(17971);
  });

  it('parses an EUR transaction', () => {
    const result = parseTossBankText(wrap(`2026.02.11.
21:46:36
Approved203314TESCO STORES 35762 EUR-0 EUR3,462
1,731.17
EUR/KRW
700000569746`));

    expect(result).toHaveLength(1);
    expect(result[0].local_currency).toBe('EUR');
    expect(result[0].local_amount).toBe(2);
    expect(result[0].krw_amount).toBe(3462);
  });

  it('parses a transaction with non-zero fee', () => {
    const result = parseTossBankText(wrap(`2026.04.01.
00:42:51
Approved100185SAINSBURYS6.75 GBP-0.45 GBP14,478
2,011.86
GBP/KRW
700000569746`));

    expect(result).toHaveLength(1);
    expect(result[0].local_amount).toBe(6.75);
    expect(result[0].krw_amount).toBe(14478);
  });

  it('includes Canceled transactions in result', () => {
    const result = parseTossBankText(wrap(`2026.01.08.
20:43:29
Canceled206013TfL Travel Charge1 GBP-0 GBP1,954
1,954.88
GBP/KRW
700000569746`));

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('Canceled');
  });

  it('strips page headers and page numbers across multiple pages', () => {
    const text = `${DOC_HEADER}
2026.01.08.
00:04:32
Approved205073STANSTED AIRPORT17 GBP-0 GBP33,233
1,954.93
GBP/KRW
700000569746
1 / 2

${TABLE_HEADER}
2026.01.09.
05:37:59
Approved206123TESCO STORES 49099.2 GBP-0 GBP17,971
1,953.47
GBP/KRW
700000569746
2 / 2

${FOOTER}`;

    const result = parseTossBankText(text);
    expect(result).toHaveLength(2);
  });
});
