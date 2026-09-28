-- Suggest distinct merchant names from the signed-in user's own transactions.
create or replace function public.search_merchant_names(search_text text default '', max_results integer default 5)
returns table (merchant_name text)
language sql
stable
security invoker
set search_path = public
as $$
  select recent.merchant_name
  from (
    select distinct on (lower(btrim(t.merchant_name)))
      btrim(t.merchant_name) as merchant_name,
      t.transacted_at
    from public.transactions as t
    where t.user_id = auth.uid()
      and nullif(btrim(t.merchant_name), '') is not null
      and starts_with(lower(btrim(t.merchant_name)), lower(btrim(search_text)))
    order by lower(btrim(t.merchant_name)), t.transacted_at desc, t.id desc
  ) as recent
  order by recent.transacted_at desc, recent.merchant_name
  limit least(greatest(coalesce(max_results, 5), 1), 5);
$$;

revoke all on function public.search_merchant_names(text, integer) from public;
grant execute on function public.search_merchant_names(text, integer) to authenticated;
