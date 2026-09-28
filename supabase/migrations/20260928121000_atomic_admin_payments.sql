alter table public.verification_deposits drop constraint if exists verification_deposits_status_check;
alter table public.verification_deposits add constraint verification_deposits_status_check
  check (status in ('created','pending','held','verified','failed','refunded','rejected'));

create or replace function public.admin_resolve_payment(
  p_actor uuid, p_entity_type text, p_entity_id uuid, p_action text,
  p_note text, p_event_id text, p_request_id text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  d public.verification_deposits%rowtype; p public.payout_requests%rowtype;
  a public.profile_edit_appeals%rowtype; e public.payment_provider_events%rowtype;
  before_state jsonb; after_state jsonb; owner_id uuid; next_status text;
begin
  if not exists(select 1 from public.profiles where id = p_actor and is_admin) then raise exception 'Forbidden'; end if;
  if p_action not in ('approve','reject','mark_paid') then raise exception 'Invalid action'; end if;
  if p_action = 'reject' and nullif(trim(p_note), '') is null then raise exception 'A rejection reason is required'; end if;
  if p_entity_type = 'verification_deposit' then
    select * into d from public.verification_deposits where id = p_entity_id for update;
    if not found then raise exception 'Verification not found'; end if;
    if p_action = 'mark_paid' or d.status not in ('created','pending','held') then raise exception 'Verification is already resolved'; end if;
    if p_action = 'approve' and d.status <> 'held' then raise exception 'Provider-confirmed payment is required before approval'; end if;
    before_state := to_jsonb(d); owner_id := d.user_id;
    perform 1 from public.profiles where id = owner_id for update;
    next_status := case when p_action = 'approve' then 'verified' else 'rejected' end;
    if p_action = 'approve' then
      if exists(select 1 from public.payout_accounts where user_id = owner_id and status = 'verified' and id <> d.payout_account_id) then raise exception 'Another account is already verified'; end if;
      update public.payout_accounts set status = 'verified', is_primary = true, verified_at = now()
        where id = d.payout_account_id and user_id = owner_id and status <> 'disabled';
      if not found then raise exception 'Payout account is unavailable'; end if;
    end if;
    update public.verification_deposits set status = next_status, verified_at = case when p_action = 'approve' then now() else null end where id = d.id returning to_jsonb(verification_deposits.*) into after_state;
    update public.profiles set payment_verification_status = next_status, payment_verified_at = case when p_action = 'approve' then now() else null end
      where id = owner_id and (p_action = 'approve' or payment_verification_status <> 'verified');
  elsif p_entity_type = 'profile_edit_appeal' then
    select * into a from public.profile_edit_appeals where id = p_entity_id for update;
    if not found or a.status <> 'pending' or p_action = 'mark_paid' then raise exception 'Appeal is not pending'; end if;
    before_state := to_jsonb(a); owner_id := a.user_id;
    next_status := case when p_action = 'approve' then 'approved' else 'rejected' end;
    update public.profile_edit_appeals set status = next_status, admin_note = p_note, reviewed_by = p_actor, reviewed_at = now() where id = a.id returning to_jsonb(profile_edit_appeals.*) into after_state;
    if p_action = 'approve' then update public.profiles set profile_edit_appeal_approved = true where id = owner_id; end if;
  elsif p_entity_type = 'payout_request' then
    select * into p from public.payout_requests where id = p_entity_id for update;
    if not found then raise exception 'Payout not found'; end if;
    before_state := to_jsonb(p); owner_id := p.user_id;
    if p_action = 'approve' and p.status not in ('requested','under_review') then raise exception 'Payout is not pending'; end if;
    if p_action = 'reject' and p.status not in ('requested','under_review','approved') then raise exception 'Payout is already resolved'; end if;
    if p_action = 'mark_paid' then
      if p.status <> 'approved' then raise exception 'Payout is not approved'; end if;
      select * into e from public.payment_provider_events where event_id = p_event_id
        and payload->>'entityId' = p.id::text and payload->>'entityType' = 'payout_request'
        and payload->>'status' = 'paid' and processed_at is not null;
      if not found then raise exception 'A reconciled event for this payout is required'; end if;
    end if;
    next_status := case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'paid' end;
    update public.payout_requests set status = next_status, admin_note = p_note, reviewed_by = p_actor, reviewed_at = now(),
      paid_at = case when next_status = 'paid' then now() else paid_at end,
      provider_event_id = case when next_status = 'paid' then p_event_id else provider_event_id end,
      reconciled_at = case when next_status = 'paid' then now() else reconciled_at end
      where id = p.id returning to_jsonb(payout_requests.*) into after_state;
  else raise exception 'Invalid entity'; end if;
  insert into public.payment_audit_logs(event_type, entity_type, entity_id, user_id, actor_id, metadata)
    values(p_entity_type || '_' || next_status, p_entity_type, p_entity_id, owner_id, p_actor, jsonb_build_object('note', p_note));
  insert into public.admin_audit_logs(actor_user_id, action, entity_type, entity_id, before_json, after_json, reason, request_id)
    values(p_actor, p_entity_type || '_' || next_status, p_entity_type, p_entity_id, before_state, after_state, p_note, p_request_id);
  return jsonb_build_object('entityId', p_entity_id, 'status', next_status);
end $$;
revoke all on function public.admin_resolve_payment(uuid,text,uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_resolve_payment(uuid,text,uuid,text,text,text,text) to service_role;

-- Preserve the existing signed payout reconciliation bridge; no balance logic changes.
create or replace function public.record_reconciled_payout_event(p_provider text, p_event_id text, p_entity_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.payout_requests%rowtype;
begin
  select * into p from public.payout_requests where id = p_entity_id for update;
  if not found then raise exception 'Payout not found'; end if;
  if p.status = 'paid' then return jsonb_build_object('duplicate', true); end if;
  if p.status <> 'approved' then raise exception 'Payout must be approved'; end if;
  if not exists(select 1 from public.payout_accounts where id = p.payout_account_id and method = p_provider) then raise exception 'Provider mismatch'; end if;
  insert into public.payment_provider_events(provider,event_id,event_type,payload,processed_at)
    values(p_provider,p_event_id,'payout.paid',jsonb_build_object('entityType','payout_request','entityId',p.id,'status','paid'),now());
  update public.payout_requests set status = 'paid', paid_at = now(), provider_event_id = p_event_id, reconciled_at = now() where id = p.id;
  insert into public.payment_audit_logs(event_type,entity_type,entity_id,user_id,metadata)
    values('payout_paid','payout_request',p.id,p.user_id,jsonb_build_object('provider',p_provider,'eventId',p_event_id));
  return jsonb_build_object('status','paid');
end $$;
revoke all on function public.record_reconciled_payout_event(text,text,uuid) from public, anon, authenticated;
grant execute on function public.record_reconciled_payout_event(text,text,uuid) to service_role;
