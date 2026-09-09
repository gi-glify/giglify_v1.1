-- Append-only audit trail for privileged admin operations.
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (char_length(trim(action)) between 2 and 120),
  entity_type text not null check (char_length(trim(entity_type)) between 2 and 120),
  entity_id uuid,
  before_json jsonb,
  after_json jsonb,
  reason text,
  request_id text not null check (char_length(trim(request_id)) between 1 and 200),
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_actor_idx on public.admin_audit_logs(actor_user_id, created_at desc);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs(entity_type, entity_id, created_at desc);
create index if not exists admin_audit_logs_action_idx on public.admin_audit_logs(action, created_at desc);
create index if not exists admin_audit_logs_created_idx on public.admin_audit_logs(created_at desc);

alter table public.admin_audit_logs enable row level security;
revoke all on public.admin_audit_logs from anon, authenticated;

create or replace function public.prevent_admin_audit_mutation()
returns trigger as $$
begin
  raise exception 'Admin audit records are append-only';
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_admin_audit_update on public.admin_audit_logs;
create trigger prevent_admin_audit_update
  before update or delete on public.admin_audit_logs
  for each row execute procedure public.prevent_admin_audit_mutation();
