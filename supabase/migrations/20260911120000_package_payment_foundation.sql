-- Package, transaction, payment-attempt, and usage foundation.
-- This migration is additive. Provider calls and entitlement mutations remain
-- server-side Edge Function responsibilities.

create table if not exists public.package_tiers (
  tier text primary key check (tier in ('free', 'pro', 'elite')),
  price_usd numeric(10,2) not null check (price_usd >= 0),
  validity_months integer check (validity_months is null or validity_months > 0),
  tasks_allowed integer check (tasks_allowed is null or tasks_allowed >= 0),
  high_paying_eligible boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_tier_has_no_renewal check (
    (tier = 'free' and validity_months is null)
    or (tier <> 'free' and validity_months is not null)
  )
);

insert into public.package_tiers (tier, price_usd, validity_months, tasks_allowed, high_paying_eligible)
values
  ('free', 0.00, null, 5, false),
  ('pro', 45.00, 3, 50, true),
  ('elite', 120.00, 3, null, true)
on conflict (tier) do update set
  price_usd = excluded.price_usd,
  validity_months = excluded.validity_months,
  tasks_allowed = excluded.tasks_allowed,
  high_paying_eligible = excluded.high_paying_eligible,
  updated_at = now();

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text,
  tuid text not null unique,
  user_id uuid not null references public.profiles(id) on delete restrict,
  transaction_type text check (
    transaction_type in ('package_purchase', 'verification_deposit', 'withdrawal', 'refund', 'adjustment')
  ),
  package_tier text references public.package_tiers(tier),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD' check (char_length(currency) between 3 and 3),
  provider text check (provider is null or provider in ('palpluss', 'paystack', 'paypal')),
  idempotency_key text,
  status text not null default 'created' check (
    status in ('created', 'pending', 'processing', 'success', 'completed', 'failed', 'cancelled', 'verification_required', 'expired')
  ),
  user_message text,
  technical_error text,
  verification_status text not null default 'unverified' check (
    verification_status in ('unverified', 'pending', 'verified', 'rejected')
  ),
  parent_transaction_id uuid references public.transactions(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz
);

-- The project already has a legacy transactions ledger. CREATE TABLE IF NOT
-- EXISTS does not alter that table, so add the package columns explicitly.
alter table public.transactions add column if not exists type text;
alter table public.transactions add column if not exists tuid text;
alter table public.transactions add column if not exists transaction_type text;
alter table public.transactions add column if not exists package_tier text;
alter table public.transactions add column if not exists provider text;
alter table public.transactions add column if not exists idempotency_key text;
alter table public.transactions add column if not exists user_message text;
alter table public.transactions add column if not exists technical_error text;
alter table public.transactions add column if not exists verification_status text default 'unverified';
alter table public.transactions add column if not exists parent_transaction_id uuid;
alter table public.transactions add column if not exists updated_at timestamptz default now();
alter table public.transactions add column if not exists completed_at timestamptz;
alter table public.transactions add column if not exists failed_at timestamptz;

alter table public.transactions alter column tuid drop not null;
alter table public.transactions alter column transaction_type drop not null;

alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions drop constraint if exists transactions_provider_check;
alter table public.transactions drop constraint if exists transactions_transaction_type_check;
alter table public.transactions drop constraint if exists transactions_verification_status_check;
alter table public.transactions add constraint transactions_status_compatibility_check check (
  status in ('created', 'pending', 'processing', 'success', 'completed', 'failed', 'cancelled', 'verification_required', 'expired')
);
alter table public.transactions add constraint transactions_provider_check check (
  provider is null or provider in ('palpluss', 'paystack', 'paypal')
);
alter table public.transactions add constraint transactions_transaction_type_check check (
  transaction_type is null or transaction_type in ('package_purchase', 'verification_deposit', 'withdrawal', 'refund', 'adjustment')
);
alter table public.transactions add constraint transactions_verification_status_check check (
  verification_status is null or verification_status in ('unverified', 'pending', 'verified', 'rejected')
);
alter table public.transactions add constraint transactions_package_tier_fk
  foreign key (package_tier) references public.package_tiers(tier);
alter table public.transactions add constraint transactions_parent_transaction_fk
  foreign key (parent_transaction_id) references public.transactions(id) on delete restrict;

create index if not exists transactions_user_created_idx
  on public.transactions(user_id, created_at desc);
create index if not exists transactions_status_created_idx
  on public.transactions(status, created_at desc);
create index if not exists transactions_provider_status_idx
  on public.transactions(provider, status, created_at desc);
create unique index if not exists transactions_user_idempotency_idx
  on public.transactions(user_id, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete restrict,
  attempt_number integer not null check (attempt_number > 0),
  provider text not null check (provider in ('palpluss', 'paystack', 'paypal')),
  provider_request_id text,
  provider_event_id text,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD' check (char_length(currency) between 3 and 3),
  request_status text not null default 'created' check (
    request_status in ('created', 'pending', 'processing', 'succeeded', 'failed', 'cancelled')
  ),
  callback_status text not null default 'pending' check (
    callback_status in ('pending', 'received', 'verified', 'rejected')
  ),
  provider_payload jsonb,
  technical_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (transaction_id, attempt_number)
);

create unique index if not exists payment_attempts_provider_request_idx
  on public.payment_attempts(provider, provider_request_id)
  where provider_request_id is not null;
create unique index if not exists payment_attempts_provider_event_idx
  on public.payment_attempts(provider, provider_event_id)
  where provider_event_id is not null;
create index if not exists payment_attempts_transaction_created_idx
  on public.payment_attempts(transaction_id, created_at desc);

create table if not exists public.package_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  tier text not null references public.package_tiers(tier),
  purchase_transaction_id uuid references public.transactions(id) on delete restrict,
  activation_at timestamptz not null default now(),
  renewal_at timestamptz,
  status text not null default 'active' check (status in ('active', 'expired', 'replaced', 'cancelled')),
  tasks_allowed integer check (tasks_allowed is null or tasks_allowed >= 0),
  high_paying_eligible boolean not null default false,
  usage_period_start timestamptz not null default now(),
  usage_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_entitlement_has_no_renewal check (
    (tier = 'free' and renewal_at is null)
    or (tier <> 'free' and renewal_at is not null)
  )
);

create unique index if not exists package_entitlements_one_active_idx
  on public.package_entitlements(user_id)
  where status = 'active';
create index if not exists package_entitlements_user_created_idx
  on public.package_entitlements(user_id, created_at desc);
create index if not exists package_entitlements_renewal_idx
  on public.package_entitlements(status, renewal_at);

create table if not exists public.package_usage_events (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.package_entitlements(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  task_id uuid not null references public.tasks(id) on delete restrict,
  submission_id uuid not null unique references public.task_submissions(id) on delete restrict,
  started_at timestamptz not null default now()
);

create index if not exists package_usage_events_entitlement_started_idx
  on public.package_usage_events(entitlement_id, started_at desc);
create index if not exists package_usage_events_user_started_idx
  on public.package_usage_events(user_id, started_at desc);

alter table public.tasks
  add column if not exists minimum_tier text not null default 'free';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tasks_minimum_tier_check'
      and conrelid = 'public.tasks'::regclass
  ) then
    alter table public.tasks
      add constraint tasks_minimum_tier_check
      check (minimum_tier in ('free', 'pro', 'elite'));
  end if;
end $$;

alter table public.package_tiers enable row level security;
alter table public.transactions enable row level security;
alter table public.payment_attempts enable row level security;
alter table public.package_entitlements enable row level security;
alter table public.package_usage_events enable row level security;

drop policy if exists "package_tiers: read active" on public.package_tiers;
create policy "package_tiers: read active"
  on public.package_tiers for select
  using (is_active = true);

drop policy if exists "transactions: read own" on public.transactions;
create policy "transactions: read own"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "payment_attempts: read own" on public.payment_attempts;
create policy "payment_attempts: read own"
  on public.payment_attempts for select
  using (
    exists (
      select 1
      from public.transactions t
      where t.id = payment_attempts.transaction_id
        and t.user_id = auth.uid()
    )
  );

drop policy if exists "package_entitlements: read own" on public.package_entitlements;
create policy "package_entitlements: read own"
  on public.package_entitlements for select
  using (auth.uid() = user_id);

drop policy if exists "package_usage_events: read own" on public.package_usage_events;
create policy "package_usage_events: read own"
  on public.package_usage_events for select
  using (auth.uid() = user_id);

-- Provider callbacks must call this server-only routine only after the provider
-- event has been authenticated. The row locks make settlement idempotent and
-- prevent two callbacks from creating two active entitlements.
create or replace function public.settle_package_payment(
  p_attempt_id uuid,
  p_provider_event_id text,
  p_provider_request_id text,
  p_provider_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.payment_attempts%rowtype;
  v_transaction public.transactions%rowtype;
  v_plan public.package_tiers%rowtype;
  v_now timestamptz := now();
  v_renewal timestamptz;
begin
  if p_attempt_id is null or nullif(trim(p_provider_event_id), '') is null then
    raise exception 'A payment attempt and provider event ID are required';
  end if;

  select * into v_attempt
  from public.payment_attempts
  where id = p_attempt_id
  for update;
  if not found then
    raise exception 'Payment attempt not found';
  end if;

  select * into v_transaction
  from public.transactions
  where id = v_attempt.transaction_id
  for update;
  if not found then
    raise exception 'Package transaction not found';
  end if;

  if v_transaction.status = 'success' then
    return jsonb_build_object(
      'status', 'success',
      'duplicate', true,
      'transaction_id', v_transaction.id,
      'tuid', v_transaction.tuid
    );
  end if;

  if v_transaction.transaction_type <> 'package_purchase'
     or v_transaction.package_tier is null
     or v_transaction.package_tier = 'free' then
    raise exception 'Only paid package purchases can be settled';
  end if;

  if v_transaction.status not in ('pending', 'processing', 'verification_required') then
    raise exception 'Package transaction is not settleable in its current state';
  end if;

  select * into v_plan
  from public.package_tiers
  where tier = v_transaction.package_tier
    and is_active = true;
  if not found then
    raise exception 'Package tier is unavailable';
  end if;

  if exists (
    select 1
    from public.package_entitlements
    where user_id = v_transaction.user_id
      and status = 'active'
      and tier <> 'free'
  ) then
    raise exception 'User already has an active paid package';
  end if;

  v_renewal := v_now + make_interval(months => v_plan.validity_months);

  update public.package_entitlements
  set status = 'replaced', updated_at = v_now
  where user_id = v_transaction.user_id
    and status = 'active';

  insert into public.package_entitlements (
    user_id,
    tier,
    purchase_transaction_id,
    activation_at,
    renewal_at,
    status,
    tasks_allowed,
    high_paying_eligible,
    usage_period_start,
    usage_period_end,
    created_at,
    updated_at
  ) values (
    v_transaction.user_id,
    v_transaction.package_tier,
    v_transaction.id,
    v_now,
    v_renewal,
    'active',
    v_plan.tasks_allowed,
    v_plan.high_paying_eligible,
    v_now,
    v_renewal,
    v_now,
    v_now
  );

  update public.payment_attempts
  set provider_event_id = p_provider_event_id,
      provider_request_id = coalesce(p_provider_request_id, provider_request_id),
      provider_payload = coalesce(p_provider_payload, '{}'::jsonb),
      request_status = 'succeeded',
      callback_status = 'verified',
      completed_at = v_now,
      updated_at = v_now
  where id = v_attempt.id;

  update public.transactions
  set status = 'success',
      verification_status = 'verified',
      completed_at = v_now,
      updated_at = v_now,
      technical_error = null
  where id = v_transaction.id;

  update public.profiles
  set subscription = v_transaction.package_tier
  where id = v_transaction.user_id;

  return jsonb_build_object(
    'status', 'success',
    'duplicate', false,
    'transaction_id', v_transaction.id,
    'tuid', v_transaction.tuid,
    'tier', v_transaction.package_tier,
    'renewal_at', v_renewal
  );
end;
$$;

revoke all on function public.settle_package_payment(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.settle_package_payment(uuid, text, text, jsonb) to service_role;

-- Preserve access for existing profiles and create the Free entitlement needed
-- for server-side task-limit enforcement.
insert into public.package_entitlements (
  user_id,
  tier,
  activation_at,
  renewal_at,
  status,
  tasks_allowed,
  high_paying_eligible,
  usage_period_start,
  usage_period_end
)
select
  p.id,
  p.subscription,
  now(),
  case when p.subscription = 'free' then null else now() + make_interval(months => pt.validity_months) end,
  'active',
  pt.tasks_allowed,
  pt.high_paying_eligible,
  now(),
  case when p.subscription = 'free' then null else now() + make_interval(months => pt.validity_months) end
from public.profiles p
join public.package_tiers pt on pt.tier = p.subscription
where not exists (
  select 1 from public.package_entitlements active
  where active.user_id = p.id and active.status = 'active'
);

create or replace function public.enforce_task_package_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task public.tasks%rowtype;
  v_entitlement public.package_entitlements%rowtype;
  v_used integer;
  v_required_rank integer;
  v_current_rank integer;
begin
  perform public.expire_due_package_entitlements();

  if auth.uid() is not null and auth.uid() <> new.user_id then
    raise exception 'A submission must belong to the signed-in user';
  end if;

  select * into v_task from public.tasks where id = new.task_id and is_active = true;
  if not found then
    raise exception 'Task is not active';
  end if;

  select * into v_entitlement
  from public.package_entitlements
  where user_id = new.user_id and status = 'active'
    and (renewal_at is null or renewal_at > now())
  order by activation_at desc
  limit 1;
  if not found then
    raise exception 'An active package entitlement is required';
  end if;

  v_required_rank := case v_task.minimum_tier when 'free' then 0 when 'pro' then 1 when 'elite' then 2 else 99 end;
  v_current_rank := case v_entitlement.tier when 'free' then 0 when 'pro' then 1 when 'elite' then 2 else -1 end;
  if v_current_rank < v_required_rank then
    raise exception 'This task requires the % package', v_task.minimum_tier;
  end if;

  if v_entitlement.tasks_allowed is not null then
    select count(*) into v_used
    from public.package_usage_events
    where entitlement_id = v_entitlement.id
      and started_at >= v_entitlement.usage_period_start
      and (v_entitlement.usage_period_end is null or started_at < v_entitlement.usage_period_end);
    if v_used >= v_entitlement.tasks_allowed then
      raise exception 'Your % package task allowance has been reached', v_entitlement.tier;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.record_package_usage_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement public.package_entitlements%rowtype;
begin
  select * into v_entitlement
  from public.package_entitlements
  where user_id = new.user_id and status = 'active'
    and (renewal_at is null or renewal_at > now())
  order by activation_at desc
  limit 1;
  if not found then
    raise exception 'An active package entitlement is required';
  end if;

  insert into public.package_usage_events (entitlement_id, user_id, task_id, submission_id, started_at)
  values (v_entitlement.id, new.user_id, new.task_id, new.id, coalesce(new.started_at, now()))
  on conflict (submission_id) do nothing;
  return new;
end;
$$;

drop trigger if exists package_task_access on public.task_submissions;
create trigger package_task_access
  before insert on public.task_submissions
  for each row execute procedure public.enforce_task_package_access();

drop trigger if exists package_usage_event on public.task_submissions;
create trigger package_usage_event
  after insert on public.task_submissions
  for each row execute procedure public.record_package_usage_event();

revoke all on function public.enforce_task_package_access() from public, anon, authenticated;
revoke all on function public.record_package_usage_event() from public, anon, authenticated;
grant execute on function public.enforce_task_package_access() to service_role;
grant execute on function public.record_package_usage_event() to service_role;

create or replace function public.expire_due_package_entitlements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired integer;
begin
  update public.package_entitlements
  set status = 'expired', updated_at = now()
  where status = 'active'
    and tier <> 'free'
    and renewal_at is not null
    and renewal_at <= now();
  get diagnostics v_expired = row_count;

  update public.profiles p
  set subscription = 'free'
  where p.id in (
    select e.user_id from public.package_entitlements e
    where e.status = 'expired' and e.tier <> 'free' and e.renewal_at <= now()
  )
  and not exists (
    select 1 from public.package_entitlements active
    where active.user_id = p.id and active.status = 'active' and active.tier <> 'free'
  );

  insert into public.package_entitlements (
    user_id, tier, activation_at, status, tasks_allowed, high_paying_eligible, usage_period_start
  )
  select p.id, 'free', now(), 'active', pt.tasks_allowed, pt.high_paying_eligible, now()
  from public.profiles p
  join public.package_tiers pt on pt.tier = 'free'
  where p.subscription = 'free'
    and not exists (
      select 1 from public.package_entitlements active
      where active.user_id = p.id and active.status = 'active'
    );

  return coalesce(v_expired, 0);
end;
$$;

revoke all on function public.expire_due_package_entitlements() from public, anon, authenticated;
grant execute on function public.expire_due_package_entitlements() to service_role;
