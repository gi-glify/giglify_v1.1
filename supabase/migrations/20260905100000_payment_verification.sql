-- Payment verification and manual payout model.
alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists payment_verification_status text not null default 'unverified',
  add column if not exists payment_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_payment_verification_status_check'
  ) then
    alter table public.profiles add constraint profiles_payment_verification_status_check
      check (payment_verification_status in ('unverified', 'deposit_pending', 'verified', 'rejected'));
  end if;
end $$;

create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  method text not null check (method in ('mpesa', 'paypal', 'stripe')),
  account_fingerprint text not null,
  account_label text not null,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'disabled')),
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (method, account_fingerprint)
);

create unique index if not exists payout_accounts_one_primary_per_user
  on public.payout_accounts(user_id) where is_primary = true and status <> 'disabled';
create unique index if not exists payout_accounts_one_verified_per_user
  on public.payout_accounts(user_id) where status = 'verified';

create table if not exists public.verification_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payout_account_id uuid references public.payout_accounts(id),
  method text not null check (method in ('mpesa', 'paypal', 'stripe')),
  amount_usd numeric(10,2) not null default 3.00 check (amount_usd = 3.00),
  amount_kes numeric(10,2) not null default 373.50 check (amount_kes = 373.50),
  exchange_rate numeric(10,2) not null default 124.50 check (exchange_rate = 124.50),
  provider_reference text unique,
  provider_payload jsonb,
  status text not null default 'created' check (status in ('created', 'pending', 'held', 'verified', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  payout_account_id uuid not null references public.payout_accounts(id),
  amount numeric(10,2) not null check (amount >= 15),
  status text not null default 'requested' check (status in ('requested', 'under_review', 'approved', 'paid', 'rejected', 'cancelled')),
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mpesa', 'paypal', 'stripe')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists verification_deposits_user_idx on public.verification_deposits(user_id);
create index if not exists payout_requests_user_idx on public.payout_requests(user_id);
create index if not exists payment_audit_logs_user_idx on public.payment_audit_logs(user_id);
create index if not exists payment_provider_events_provider_idx on public.payment_provider_events(provider);

alter table public.payout_accounts enable row level security;
alter table public.verification_deposits enable row level security;
alter table public.payout_requests enable row level security;
alter table public.payment_audit_logs enable row level security;
alter table public.payment_provider_events enable row level security;

drop policy if exists "payout_accounts: read own" on public.payout_accounts;
create policy "payout_accounts: read own" on public.payout_accounts
  for select using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "verification_deposits: read own" on public.verification_deposits;
create policy "verification_deposits: read own" on public.verification_deposits
  for select using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "payout_requests: read own" on public.payout_requests;
create policy "payout_requests: read own" on public.payout_requests
  for select using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "payment_audit_logs: read own" on public.payment_audit_logs;
create policy "payment_audit_logs: read own" on public.payment_audit_logs
  for select using (auth.uid() = user_id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

drop policy if exists "payment_provider_events: admin read" on public.payment_provider_events;
create policy "payment_provider_events: admin read" on public.payment_provider_events
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

create or replace function public.protect_payment_profile_fields()
returns trigger as $$
begin
  if auth.uid() = old.id and (
    new.is_admin is distinct from old.is_admin or
    new.payment_verification_status is distinct from old.payment_verification_status or
    new.payment_verified_at is distinct from old.payment_verified_at
  ) then
    raise exception 'Payment verification fields can only be changed by the payment service';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_payment_profile_fields on public.profiles;
create trigger protect_payment_profile_fields
  before update on public.profiles
  for each row execute procedure public.protect_payment_profile_fields();
