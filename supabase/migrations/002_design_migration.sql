-- 1. accounts 테이블 (KRW / GBP 잔고 관리)
create table public.accounts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  currency     char(3) not null check (currency in ('KRW', 'GBP')),
  balance      numeric(20, 2) not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (user_id, currency)
);
alter table public.accounts enable row level security;
create policy "Users manage own accounts"
  on public.accounts for all using (auth.uid() = user_id);

-- 2. user_settings 테이블 (목표 기간 + 환율 캐시)
create table public.user_settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete cascade not null unique,
  target_date         date not null,
  exchange_rate       numeric(10, 2) default 1970,
  exchange_rate_at    date,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);
alter table public.user_settings enable row level security;
create policy "Users manage own settings"
  on public.user_settings for all using (auth.uid() = user_id);

-- 3. exchange_records 테이블 (환전 이벤트)
create table public.exchange_records (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  krw_out       numeric(20, 2) not null,
  gbp_in        numeric(10, 2) not null,
  rate          numeric(10, 2) not null,
  exchanged_at  date not null,
  created_at    timestamptz default now()
);
alter table public.exchange_records enable row level security;
create policy "Users manage own exchange_records"
  on public.exchange_records for all using (auth.uid() = user_id);

-- 4. categories 테이블
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  name       text not null,
  color      text not null default '#8991B2',
  emoji      text not null default '📦',
  created_at timestamptz default now()
);
alter table public.categories enable row level security;
create policy "Users manage own categories"
  on public.categories for all using (auth.uid() = user_id);

-- 5. transactions 테이블 업데이트 (TossBank PDF 컬럼 추가)
alter table public.transactions
  add column if not exists status         text default 'Approved',
  add column if not exists approval_no    text,
  add column if not exists local_amount   numeric(15, 2),
  add column if not exists local_currency char(3),
  add column if not exists source         text default 'tossbank_pdf',
  add column if not exists account_type   char(3) default 'GBP';

-- approval_no 중복 방지
alter table public.transactions
  add constraint transactions_approval_no_user_unique unique (user_id, approval_no);

-- 6. monzo_tokens 제거
drop table if exists public.monzo_tokens;
