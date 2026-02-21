-- profiles: linked to Supabase Auth users
create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text,
  created_at timestamptz default now()
);

-- trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Monzo OAuth tokens
create table public.monzo_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.profiles(id) on delete cascade not null,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz,
  account_id    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- transactions
create table public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  transaction_id    text unique not null,
  amount            numeric(15, 2) not null,
  currency          char(3) not null,
  exchange_rate     numeric(15, 4),
  krw_amount        integer,
  is_estimated_rate boolean default false,
  merchant_name     text,
  category          text,
  receipt_url       text,
  transacted_at     timestamptz not null,
  created_at        timestamptz default now()
);

create index on public.transactions(user_id, transacted_at desc);

-- enable Row Level Security
alter table public.profiles enable row level security;
alter table public.monzo_tokens enable row level security;
alter table public.transactions enable row level security;

-- RLS policies: users can only access their own data
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can view own tokens"
  on public.monzo_tokens for all
  using (auth.uid() = user_id);

create policy "Users can view own transactions"
  on public.transactions for all
  using (auth.uid() = user_id);
