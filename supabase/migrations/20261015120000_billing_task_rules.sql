-- Production billing and worker-access rules.
-- Prices are USD; Daraja amounts are configured separately in KES at 131 KES/USD.

alter table public.package_tiers
  add column if not exists daily_tasks_allowed integer,
  add column if not exists weekly_tasks_allowed integer,
  add column if not exists max_task_reward_usd numeric(10,2);

alter table public.package_tiers drop constraint if exists package_tiers_tier_check;
alter table public.package_tiers add constraint package_tiers_tier_check
  check (tier in ('free', 'pro', 'elite', 'max'));

alter table public.package_tiers drop constraint if exists package_tiers_daily_tasks_allowed_check;
alter table public.package_tiers add constraint package_tiers_daily_tasks_allowed_check
  check (daily_tasks_allowed is null or daily_tasks_allowed >= 0);
alter table public.package_tiers drop constraint if exists package_tiers_weekly_tasks_allowed_check;
alter table public.package_tiers add constraint package_tiers_weekly_tasks_allowed_check
  check (weekly_tasks_allowed is null or weekly_tasks_allowed >= 0);
alter table public.package_tiers drop constraint if exists package_tiers_max_task_reward_check;
alter table public.package_tiers add constraint package_tiers_max_task_reward_check
  check (max_task_reward_usd is null or max_task_reward_usd > 0);

insert into public.package_tiers (
  tier, price_usd, validity_months, tasks_allowed, daily_tasks_allowed,
  weekly_tasks_allowed, max_task_reward_usd, high_paying_eligible, is_active
)
values
  ('free', 0.00, null, 4, 1, 1, 4.99, false, true),
  ('pro', 19.00, 1, 30, 1, null, 9.90, true, true),
  ('elite', 49.00, 1, 90, 3, null, 20.00, true, true),
  ('max', 99.00, 1, null, null, null, null, true, true)
on conflict (tier) do update set
  price_usd = excluded.price_usd,
  validity_months = excluded.validity_months,
  tasks_allowed = excluded.tasks_allowed,
  daily_tasks_allowed = excluded.daily_tasks_allowed,
  weekly_tasks_allowed = excluded.weekly_tasks_allowed,
  max_task_reward_usd = excluded.max_task_reward_usd,
  high_paying_eligible = excluded.high_paying_eligible,
  is_active = excluded.is_active,
  updated_at = now();

alter table public.profiles drop constraint if exists profiles_subscription_check;
alter table public.profiles add constraint profiles_subscription_check
  check (subscription in ('free', 'pro', 'elite', 'max'));

alter table public.tasks drop constraint if exists tasks_minimum_tier_check;
alter table public.tasks add constraint tasks_minimum_tier_check
  check (minimum_tier in ('free', 'pro', 'elite', 'max'));

alter table public.package_entitlements
  add column if not exists daily_tasks_allowed integer,
  add column if not exists weekly_tasks_allowed integer,
  add column if not exists max_task_reward_usd numeric(10,2);

alter table public.package_entitlements drop constraint if exists package_entitlements_daily_tasks_allowed_check;
alter table public.package_entitlements add constraint package_entitlements_daily_tasks_allowed_check
  check (daily_tasks_allowed is null or daily_tasks_allowed >= 0);
alter table public.package_entitlements drop constraint if exists package_entitlements_weekly_tasks_allowed_check;
alter table public.package_entitlements add constraint package_entitlements_weekly_tasks_allowed_check
  check (weekly_tasks_allowed is null or weekly_tasks_allowed >= 0);
alter table public.package_entitlements drop constraint if exists package_entitlements_max_task_reward_check;
alter table public.package_entitlements add constraint package_entitlements_max_task_reward_check
  check (max_task_reward_usd is null or max_task_reward_usd > 0);

update public.package_entitlements e
set tasks_allowed = t.tasks_allowed,
    daily_tasks_allowed = t.daily_tasks_allowed,
    weekly_tasks_allowed = t.weekly_tasks_allowed,
    max_task_reward_usd = t.max_task_reward_usd,
    high_paying_eligible = t.high_paying_eligible,
    updated_at = now()
from public.package_tiers t
where t.tier = e.tier;

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
  select * into v_attempt from public.payment_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Payment attempt not found'; end if;
  select * into v_transaction from public.transactions where id = v_attempt.transaction_id for update;
  if not found then raise exception 'Package transaction not found'; end if;
  if v_transaction.status = 'success' then
    return jsonb_build_object('status', 'success', 'duplicate', true, 'transaction_id', v_transaction.id, 'tuid', v_transaction.tuid);
  end if;
  if v_transaction.transaction_type <> 'package_purchase' or v_transaction.package_tier is null or v_transaction.package_tier = 'free' then
    raise exception 'Only paid package purchases can be settled';
  end if;
  if v_transaction.status not in ('pending', 'processing', 'verification_required') then
    raise exception 'Package transaction is not settleable in its current state';
  end if;
  select * into v_plan from public.package_tiers where tier = v_transaction.package_tier and is_active = true;
  if not found then raise exception 'Package tier is unavailable'; end if;
  if exists (select 1 from public.package_entitlements where user_id = v_transaction.user_id and status = 'active' and tier <> 'free') then
    raise exception 'User already has an active paid package';
  end if;
  v_renewal := v_now + make_interval(months => v_plan.validity_months);
  update public.package_entitlements set status = 'replaced', updated_at = v_now where user_id = v_transaction.user_id and status = 'active';
  insert into public.package_entitlements (
    user_id, tier, purchase_transaction_id, activation_at, renewal_at, status,
    tasks_allowed, daily_tasks_allowed, weekly_tasks_allowed, max_task_reward_usd,
    high_paying_eligible, usage_period_start, usage_period_end, created_at, updated_at
  ) values (
    v_transaction.user_id, v_transaction.package_tier, v_transaction.id, v_now, v_renewal, 'active',
    v_plan.tasks_allowed, v_plan.daily_tasks_allowed, v_plan.weekly_tasks_allowed, v_plan.max_task_reward_usd,
    v_plan.high_paying_eligible, v_now, v_renewal, v_now, v_now
  );
  update public.payment_attempts set provider_event_id = p_provider_event_id, provider_request_id = coalesce(p_provider_request_id, provider_request_id), provider_payload = coalesce(p_provider_payload, '{}'::jsonb), request_status = 'succeeded', callback_status = 'verified', completed_at = v_now, updated_at = v_now where id = v_attempt.id;
  update public.transactions set status = 'success', verification_status = 'verified', completed_at = v_now, updated_at = v_now, technical_error = null where id = v_transaction.id;
  update public.profiles set subscription = v_transaction.package_tier where id = v_transaction.user_id;
  return jsonb_build_object('status', 'success', 'duplicate', false, 'transaction_id', v_transaction.id, 'tuid', v_transaction.tuid, 'tier', v_transaction.package_tier, 'renewal_at', v_renewal);
end;
$$;

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
  if auth.uid() is not null and auth.uid() <> new.user_id then raise exception 'A submission must belong to the signed-in user'; end if;
  select * into v_task from public.tasks where id = new.task_id and is_active = true;
  if not found then raise exception 'Task is not active'; end if;
  select * into v_entitlement from public.package_entitlements
  where user_id = new.user_id and status = 'active' and (renewal_at is null or renewal_at > now())
  order by activation_at desc limit 1 for update;
  if not found then raise exception 'An active package entitlement is required'; end if;

  v_required_rank := case v_task.minimum_tier when 'free' then 0 when 'pro' then 1 when 'elite' then 2 when 'max' then 3 else 99 end;
  v_current_rank := case v_entitlement.tier when 'free' then 0 when 'pro' then 1 when 'elite' then 2 when 'max' then 3 else -1 end;
  if v_current_rank < v_required_rank then raise exception 'This task requires the % package', v_task.minimum_tier; end if;
  if v_entitlement.max_task_reward_usd is not null and v_task.reward > v_entitlement.max_task_reward_usd then
    raise exception 'This task pays $%, above your % package limit of $%', to_char(v_task.reward, 'FM999990.00'), v_entitlement.tier, to_char(v_entitlement.max_task_reward_usd, 'FM999990.00');
  end if;

  if v_entitlement.tasks_allowed is not null then
    select count(*) into v_used from public.package_usage_events
    where entitlement_id = v_entitlement.id and started_at >= case when v_entitlement.tier = 'free' then date_trunc('month', now()) else v_entitlement.usage_period_start end
      and (v_entitlement.usage_period_end is null or started_at < v_entitlement.usage_period_end);
    if v_used >= v_entitlement.tasks_allowed then raise exception 'Your % package monthly task allowance has been reached', v_entitlement.tier; end if;
  end if;
  if v_entitlement.daily_tasks_allowed is not null then
    select count(*) into v_used from public.package_usage_events where entitlement_id = v_entitlement.id and started_at >= now() - interval '24 hours';
    if v_used >= v_entitlement.daily_tasks_allowed then raise exception 'Your % package daily task allowance has been reached', v_entitlement.tier; end if;
  end if;
  if v_entitlement.weekly_tasks_allowed is not null then
    select count(*) into v_used from public.package_usage_events where entitlement_id = v_entitlement.id and started_at >= now() - interval '7 days';
    if v_used >= v_entitlement.weekly_tasks_allowed then raise exception 'Your % package weekly task allowance has been reached', v_entitlement.tier; end if;
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
declare v_entitlement public.package_entitlements%rowtype;
begin
  select * into v_entitlement from public.package_entitlements where user_id = new.user_id and status = 'active' and (renewal_at is null or renewal_at > now()) order by activation_at desc limit 1;
  if not found then raise exception 'An active package entitlement is required'; end if;
  insert into public.package_usage_events (entitlement_id, user_id, task_id, submission_id, started_at)
  values (v_entitlement.id, new.user_id, new.task_id, new.id, coalesce(new.started_at, now())) on conflict (submission_id) do nothing;
  return new;
end;
$$;

create or replace function public.expire_due_package_entitlements()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_expired integer;
begin
  update public.package_entitlements set status = 'expired', updated_at = now() where status = 'active' and tier <> 'free' and renewal_at is not null and renewal_at <= now();
  get diagnostics v_expired = row_count;
  update public.profiles p set subscription = 'free' where p.id in (select e.user_id from public.package_entitlements e where e.status = 'expired' and e.tier <> 'free' and e.renewal_at <= now()) and not exists (select 1 from public.package_entitlements active where active.user_id = p.id and active.status = 'active' and active.tier <> 'free');
  insert into public.package_entitlements (user_id, tier, activation_at, status, tasks_allowed, daily_tasks_allowed, weekly_tasks_allowed, max_task_reward_usd, high_paying_eligible, usage_period_start)
  select p.id, 'free', now(), 'active', pt.tasks_allowed, pt.daily_tasks_allowed, pt.weekly_tasks_allowed, pt.max_task_reward_usd, pt.high_paying_eligible, now()
  from public.profiles p join public.package_tiers pt on pt.tier = 'free'
  where p.subscription = 'free' and not exists (select 1 from public.package_entitlements active where active.user_id = p.id and active.status = 'active');
  return coalesce(v_expired, 0);
end;
$$;

revoke all on function public.settle_package_payment(uuid, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.enforce_task_package_access() from public, anon, authenticated;
revoke all on function public.record_package_usage_event() from public, anon, authenticated;
revoke all on function public.expire_due_package_entitlements() from public, anon, authenticated;
grant execute on function public.settle_package_payment(uuid, text, text, jsonb) to service_role;
grant execute on function public.enforce_task_package_access() to service_role;
grant execute on function public.record_package_usage_event() to service_role;
grant execute on function public.expire_due_package_entitlements() to service_role;
