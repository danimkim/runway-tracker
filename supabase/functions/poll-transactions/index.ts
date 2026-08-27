// supabase/functions/poll-transactions/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MONZO_CLIENT_ID = Deno.env.get('MONZO_CLIENT_ID')!;
const MONZO_CLIENT_SECRET = Deno.env.get('MONZO_CLIENT_SECRET')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function refreshMonzoToken(refreshToken: string) {
  const res = await fetch('https://api.monzo.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: MONZO_CLIENT_ID,
      client_secret: MONZO_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

Deno.serve(async () => {
  const { data: tokens, error } = await supabase
    .from('monzo_tokens')
    .select('*');

  if (error || !tokens?.length) {
    return new Response(JSON.stringify({ message: 'No tokens found' }), {
      status: 200,
    });
  }

  for (const tokenRow of tokens) {
    try {
      let { access_token, refresh_token } = tokenRow;
      const { expires_at, user_id, account_id } = tokenRow;

      // refresh if expiring within 10 minutes
      const expiresAtDate = new Date(expires_at);
      if (expiresAtDate.getTime() - Date.now() < 10 * 60 * 1000) {
        const newToken = await refreshMonzoToken(refresh_token);
        access_token = newToken.access_token;
        refresh_token = newToken.refresh_token;
        const newExpiresAt = new Date(
          Date.now() + newToken.expires_in * 1000,
        ).toISOString();

        await supabase
          .from('monzo_tokens')
          .update({
            access_token,
            refresh_token,
            expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tokenRow.id);
      }

      // fetch last 7 days of transactions
      const before = new Date().toISOString();
      const since = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const params = new URLSearchParams({
        account_id,
        since,
        before,
        'expand[]': 'merchant',
      });

      const tranRes = await fetch(
        `https://api.monzo.com/transactions?${params}`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        },
      );

      if (!tranRes.ok) continue;
      const { transactions } = await tranRes.json();

      for (const tx of transactions) {
        // skip credits, pending, and declined transactions
        if (tx.amount >= 0 || !tx.settled || tx.decline_reason) continue;

        // Monzo amounts are in minor units (pence), negative for debits
        const isLocal = tx.currency === tx.local_currency;
        const currency = isLocal ? tx.currency : tx.local_currency;
        // convert from minor units to major units
        const amount = Math.abs(tx.local_amount) / 100;
        const gbpDeducted = Math.abs(tx.amount) / 100;

        let exchange_rate: number | null = null;
        let krw_amount: number | null = null;
        let is_estimated_rate = false;

        if (isLocal) {
          // GBP transaction — no conversion needed
          exchange_rate = 1;
          krw_amount = null;
        } else {
          // foreign currency — back-calculate rate from GBP deducted
          exchange_rate = gbpDeducted / amount;
          krw_amount = null;
          is_estimated_rate = false;
        }

        const merchantName = tx.merchant?.name ?? tx.description;

        await supabase.from('transactions').upsert(
          {
            user_id,
            transaction_id: tx.id,
            amount,
            currency,
            exchange_rate,
            krw_amount,
            is_estimated_rate,
            merchant_name: merchantName,
            category: tx.category,
            transacted_at: tx.created,
          },
          { onConflict: 'transaction_id', ignoreDuplicates: true },
        );
      }
    } catch (err) {
      console.error(`Error processing user ${tokenRow.user_id}:`, err);
    }
  }

  return new Response(JSON.stringify({ message: 'Polling complete' }), {
    status: 200,
  });
});
