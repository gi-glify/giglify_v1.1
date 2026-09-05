-- ============================================================================
-- Giglify database schema + Question Bank migrations
-- This is the COMPLETE, updated schema with all question bank additions
-- Replace the contents of supabase/schema.sql with this file
-- Run in the Supabase SQL editor or via `supabase db push`
-- ============================================================================

-- Extensions -----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ============================================================================
-- profiles — one row per auth user; drives the profile-completion % gate
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  avatar_url text,
  phone text,
  country text,
  bio text,
  skills text[] default '{}',
  date_of_birth date,
  payout_method_added boolean not null default false,
  profile_picture text,
  id_type text,
  id_number text,
  address text,
  full_legal_name text,
  payout_method text,
  payout_account text,
  proof_of_payment text,
  subscription text not null default 'free' check (subscription in ('free', 'pro', 'elite')),
  profile_completion_pct int not null default 0,
  is_admin boolean not null default false,
  payment_verification_status text not null default 'unverified'
    check (payment_verification_status in ('unverified', 'deposit_pending', 'verified', 'rejected')),
  payment_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- tasks — the catalog. Includes question bank metadata (task_code, field).
-- ============================================================================
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null check (category in ('academic', 'rlhf', 'data-verification')),
  reward numeric(10, 2) not null check (reward >= 0),
  estimated_time_minutes int not null check (estimated_time_minutes > 0),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'expert')),
  device text not null default 'any' check (device in ('any', 'mobile', 'desktop')),
  requires_desktop boolean not null default false,
  is_active boolean not null default true,
  task_code text unique,
  field text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- task_questions — 10 open-ended review questions per task (600 total)
-- Read policy checks is_active on the parent task
-- ============================================================================
create table if not exists public.task_questions (
  id uuid primary key default uuid_generate_v4(),
  task_code text not null references public.tasks(task_code) on delete cascade,
  question_number int not null check (question_number >= 1 and question_number <= 10),
  question_text text not null,
  model_answer text not null,
  created_at timestamptz not null default now(),
  unique(task_code, question_number)
);

create index if not exists idx_task_questions_code on public.task_questions (task_code);

-- ============================================================================
-- task_submissions — one row per user attempt/completion of a task.
-- This is the single source of truth for "completed today" counts and
-- for how a user's balance grows.
-- ============================================================================
create table if not exists public.task_submissions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  status text not null default 'in-progress' check (status in ('in-progress', 'submitted', 'approved', 'rejected')),
  reward_paid numeric(10, 2),
  submitted_content jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_task_submissions_user on public.task_submissions (user_id);
create index if not exists idx_task_submissions_task on public.task_submissions (task_id);

-- ==========================================================================
-- Payment verification and manual payouts
-- ==========================================================================
create table if not exists public.payout_accounts (
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
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
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.payment_provider_events (
  id uuid primary key default uuid_generate_v4(),
  provider text not null check (provider in ('mpesa', 'paypal', 'stripe')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create unique index if not exists payout_accounts_one_primary_per_user_schema
  on public.payout_accounts(user_id) where is_primary = true and status <> 'disabled';
create unique index if not exists payout_accounts_one_verified_per_user_schema
  on public.payout_accounts(user_id) where status = 'verified';
create index if not exists payment_provider_events_provider_idx on public.payment_provider_events(provider);

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

-- ============================================================================
-- wallets — running balance per user. Kept as its own table (rather than a
-- column on profiles) so it can be updated transactionally from triggers.
-- ============================================================================
create table if not exists public.wallets (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  balance numeric(10, 2) not null default 0 check (balance >= 0),
  currency text not null default 'USD',
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_wallet()
returns trigger as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_wallet();

-- ============================================================================
-- transactions — audit trail for every balance change: task rewards,
-- deposits (subscriptions), and withdrawals.
-- ============================================================================
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal', 'task-reward')),
  amount numeric(10, 2) not null,
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  description text,
  related_submission_id uuid references public.task_submissions (id),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions (user_id);

-- When a submission is approved, credit the wallet and log a transaction.
create or replace function public.handle_submission_approved()
returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.completed_at := now();
    new.reward_paid := (select reward from public.tasks where id = new.task_id);

    update public.wallets
      set balance = balance + new.reward_paid,
          updated_at = now()
      where user_id = new.user_id;

    insert into public.transactions (user_id, type, amount, status, description, related_submission_id)
    values (
      new.user_id,
      'task-reward',
      new.reward_paid,
      'completed',
      'Reward for task ' || new.task_id,
      new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_submission_status_change on public.task_submissions;
create trigger on_submission_status_change
  before update on public.task_submissions
  for each row execute procedure public.handle_submission_approved();

-- ============================================================================
-- withdrawals — enforces the $15 minimum described in the product brief.
-- ============================================================================
create table if not exists public.withdrawals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 15),
  method text not null check (method in ('stripe', 'paypal', 'mpesa')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create or replace function public.request_withdrawal(p_amount numeric, p_method text)
returns uuid as $$
declare
  v_balance numeric;
  v_id uuid;
begin
  select balance into v_balance from public.wallets where user_id = auth.uid();

  if p_amount < 15 then
    raise exception 'Minimum withdrawal is $15.00';
  end if;
  if v_balance is null or v_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;

  update public.wallets set balance = balance - p_amount, updated_at = now() where user_id = auth.uid();

  insert into public.withdrawals (user_id, amount, method) values (auth.uid(), p_amount, p_method)
  returning id into v_id;

  insert into public.transactions (user_id, type, amount, status, description)
  values (auth.uid(), 'withdrawal', p_amount, 'pending', 'Withdrawal via ' || p_method);

  return v_id;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- notifications
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  detail text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security — users only ever see/modify their own rows.
-- Tasks and task questions are readable by any authenticated user but not writable by them.
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_questions enable row level security;
alter table public.task_submissions enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.withdrawals enable row level security;
alter table public.notifications enable row level security;
alter table public.payout_accounts enable row level security;
alter table public.verification_deposits enable row level security;
alter table public.payout_requests enable row level security;
alter table public.payment_audit_logs enable row level security;
alter table public.payment_provider_events enable row level security;

create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id);

create policy "tasks: read active tasks" on public.tasks for select using (is_active = true);

create policy "task_questions: read for active tasks" on public.task_questions
  for select using (
    exists (
      select 1 from public.tasks t
      where t.task_code = task_questions.task_code
        and t.is_active = true
    )
  );

create policy "submissions: read own" on public.task_submissions for select using (auth.uid() = user_id);
create policy "submissions: insert own" on public.task_submissions for insert with check (auth.uid() = user_id);
create policy "submissions: update own" on public.task_submissions for update using (auth.uid() = user_id);

create policy "wallets: read own" on public.wallets for select using (auth.uid() = user_id);

create policy "transactions: read own" on public.transactions for select using (auth.uid() = user_id);

create policy "withdrawals: read own" on public.withdrawals for select using (auth.uid() = user_id);
create policy "withdrawals: insert own" on public.withdrawals for insert with check (auth.uid() = user_id);

create policy "notifications: read own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications: update own" on public.notifications for update using (auth.uid() = user_id);

create policy "payout_accounts: read own" on public.payout_accounts for select using (auth.uid() = user_id);
create policy "verification_deposits: read own" on public.verification_deposits for select using (auth.uid() = user_id);
create policy "payout_requests: read own" on public.payout_requests for select using (auth.uid() = user_id);
create policy "payment_audit_logs: read own" on public.payment_audit_logs for select using (auth.uid() = user_id);
create policy "payment_provider_events: admin read" on public.payment_provider_events
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin));

-- ============================================================================
-- Seed demo tasks (REMOVED)
-- Note: Question bank data (60 tasks + 600 questions) are seeded separately
-- via seed_questions.sql when the module is deployed.
-- ============================================================================
