alter table public.payment_attempts add column if not exists expected_amount numeric(12,2),
  add column if not exists expected_currency text;
-- Old M-Pesa attempts require manual reconciliation; do not guess their KES amount.
update public.payment_attempts a set expected_amount = t.amount, expected_currency = t.currency
from public.transactions t where a.transaction_id = t.id and a.provider <> 'mpesa' and a.expected_amount is null;

create table if not exists public.request_limits (
  key text primary key, window_start timestamptz not null, count integer not null
);
alter table public.request_limits enable row level security;
revoke all on public.request_limits from anon, authenticated;
create or replace function public.consume_request_limit(p_key text, p_limit integer, p_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if p_limit < 1 or p_seconds < 1 then raise exception 'Invalid limit'; end if;
  insert into public.request_limits as r (key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when r.window_start <= now() - make_interval(secs => p_seconds) then 1 else r.count + 1 end,
    window_start = case when r.window_start <= now() - make_interval(secs => p_seconds) then now() else r.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end $$;
revoke all on function public.consume_request_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_request_limit(text, integer, integer) to service_role;

create or replace function public.apply_verified_payment_event(
  p_provider text, p_event_id text, p_reference text, p_status text,
  p_amount numeric, p_currency text, p_payload jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.payment_attempts%rowtype; t public.transactions%rowtype; d public.verification_deposits%rowtype;
begin
  if p_provider not in ('paypal','paystack','mpesa') or p_status not in ('success','failed','pending')
    or nullif(p_reference, '') is null or nullif(p_event_id, '') is null then raise exception 'Invalid event'; end if;
  insert into public.payment_provider_events(provider, event_id, event_type, payload, processed_at)
  values (p_provider, p_event_id, p_status, p_payload, now()) on conflict (provider, event_id) do nothing;
  if not found then return jsonb_build_object('duplicate', true); end if;
  select * into a from public.payment_attempts where provider = p_provider and provider_request_id = p_reference for update;
  if found then
    select * into t from public.transactions where id = a.transaction_id for update;
    if t.status in ('success','failed','cancelled','expired','refunded') then return jsonb_build_object('ignored', true); end if;
    if p_status = 'success' then
      if p_amount is null or p_currency is null or a.expected_amount is null or a.expected_currency is null
        or p_amount <> a.expected_amount or p_currency <> a.expected_currency then raise exception 'Payment amount or currency mismatch'; end if;
      return public.settle_package_payment(a.id, p_event_id, p_reference, p_payload);
    elsif p_status = 'failed' then
      update public.payment_attempts set request_status = 'failed', callback_status = 'verified', provider_event_id = p_event_id,
        provider_payload = p_payload, completed_at = now(), updated_at = now() where id = a.id;
      update public.transactions set status = 'failed', failed_at = now(), updated_at = now() where id = t.id;
    end if;
    return jsonb_build_object('status', p_status);
  end if;
  select * into d from public.verification_deposits where method = p_provider and provider_reference = p_reference for update;
  if not found then raise exception 'Payment reference not yet available'; end if;
  if d.status not in ('created','pending') then return jsonb_build_object('ignored', true); end if;
  if p_status = 'success' then
    if p_amount is null or p_currency is null
      or p_amount <> (case when p_provider = 'mpesa' then round(d.amount_kes) else d.amount_usd end)
      or p_currency <> (case when p_provider = 'mpesa' then 'KES' else 'USD' end)
    then
      raise exception 'Payment amount or currency mismatch';
    end if;
    update public.verification_deposits set status = 'held', provider_payload = p_payload where id = d.id;
  elsif p_status = 'failed' then
    update public.verification_deposits set status = 'failed', provider_payload = p_payload where id = d.id;
  end if;
  insert into public.payment_audit_logs(event_type, entity_type, entity_id, user_id, metadata)
    values ('verification_' || p_status, 'verification_deposit', d.id, d.user_id, jsonb_build_object('provider', p_provider, 'eventId', p_event_id));
  return jsonb_build_object('status', p_status);
end $$;
revoke all on function public.apply_verified_payment_event(text,text,text,text,numeric,text,jsonb) from public, anon, authenticated;
grant execute on function public.apply_verified_payment_event(text,text,text,text,numeric,text,jsonb) to service_role;
